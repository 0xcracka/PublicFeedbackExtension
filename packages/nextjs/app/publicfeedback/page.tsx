"use client";

import { useEffect, useMemo, useState } from "react";
import { NextPage } from "next";
import { Log } from "viem";
import { useScaffoldEventHistory, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type ScaffoldEventData = {
  args: any;
  receiptData: any;
  eventName: React.ReactNode;
  log: Log<bigint, number, false>;
};

// Embedded PollEvents component
const PollEvents = () => {
  const {
    data: pollCreatedEvents,
    isLoading: isLoadingPollCreated,
    error: errorReadingPollCreated,
  } = useScaffoldEventHistory({
    contractName: "PollingContract",
    eventName: "PollCreated",
    fromBlock: 0n,
    watch: true,
    blockData: true,
    transactionData: true,
    receiptData: true,
  });

  const {
    data: voteCastedEvents,
    isLoading: isLoadingVoteCasted,
    error: errorReadingVoteCasted,
  } = useScaffoldEventHistory({
    contractName: "PollingContract",
    eventName: "VoteCasted",
    fromBlock: 0n,
    watch: true,
    blockData: true,
    transactionData: true,
    receiptData: true,
  });

  const pollOptions = useMemo(() => {
    const options: { [key: string]: string[] } = {};
    pollCreatedEvents?.forEach((event: ScaffoldEventData) => {
      const args = event.args as any;
      if (args && args.pollId !== undefined && Array.isArray(args.options)) {
        options[args.pollId.toString()] = args.options;
      }
    });
    return options;
  }, [pollCreatedEvents]);

  if (isLoadingPollCreated || isLoadingVoteCasted) return <div>Loading...</div>;
  if (errorReadingPollCreated) return <div>Error loading PollCreated events: {errorReadingPollCreated.message}</div>;
  if (errorReadingVoteCasted) return <div>Error loading VoteCasted events: {errorReadingVoteCasted.message}</div>;

  const getEventKey = (event: ScaffoldEventData) => {
    return `${event.log?.blockNumber || "unknown"}-${event.log?.logIndex || "unknown"}`;
  };

  const getArgs = (event: ScaffoldEventData) => {
    return (event.args || {}) as any;
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Polls Created</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-base-100 border border-base-300 mb-8">
          <thead>
            <tr className="bg-base-200">
              <th className="px-4 py-2 text-left">Poll ID</th>
              <th className="px-4 py-2 text-left">Creator Address</th>
              <th className="px-4 py-2 text-left">Question</th>
              <th className="px-4 py-2 text-left">Options</th>
            </tr>
          </thead>
          <tbody>
            {pollCreatedEvents?.map((event: ScaffoldEventData) => {
              const args = getArgs(event);
              return (
                <tr key={getEventKey(event)} className="border-t border-base-300">
                  <td className="px-4 py-2">{args.pollId?.toString() || "N/A"}</td>
                  <td className="px-4 py-2">{event.receiptData?.from || "N/A"}</td>
                  <td className="px-4 py-2">{args.question || "N/A"}</td>
                  <td className="px-4 py-2">{args.options?.join(", ") || "N/A"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mb-2">Votes Casted</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-base-100 border border-base-300">
          <thead>
            <tr className="bg-base-200">
              <th className="px-4 py-2 text-left">Poll ID</th>
              <th className="px-4 py-2 text-left">Voter Address</th>
              <th className="px-4 py-2 text-left">Selected Option</th>
            </tr>
          </thead>
          <tbody>
            {voteCastedEvents?.map((event: ScaffoldEventData) => {
              const args = getArgs(event);
              const pollId = args.pollId?.toString();
              const optionIndex = args.optionIndex !== undefined ? Number(args.optionIndex) : undefined;
              const options = pollOptions[pollId] || [];
              const selectedOption =
                optionIndex !== undefined && optionIndex < options.length ? options[optionIndex] : "Unknown";

              return (
                <tr key={getEventKey(event)} className="border-t border-base-300">
                  <td className="px-4 py-2">{pollId || "N/A"}</td>
                  <td className="px-4 py-2">{event.receiptData?.from || "N/A"}</td>
                  <td className="px-4 py-2">{selectedOption}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PublicFeedback: NextPage = () => {
  const [polls, setPolls] = useState<any[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Fetch poll count
  const { data: pollCount } = useScaffoldReadContract({
    contractName: "PollingContract",
    functionName: "pollCount",
  });

  const pollId = Number(pollCount ?? 0) - 1; // Assuming the latest poll is the last one;

  // Write to the contract: Create Poll
  const { writeContractAsync: createPoll } = useScaffoldWriteContract("PollingContract");

  // Write to the contract: Vote
  const { writeContractAsync: vote } = useScaffoldWriteContract("PollingContract");

  const { data: pollDetails } = useScaffoldReadContract({
    contractName: "PollingContract",
    functionName: "getPollDetails",
    args: [BigInt(pollId)],
  });

  // Function to fetch poll details when button is clicked
  const fetchPollDetails = () => {
    if (pollId >= 0 && pollDetails) {
      setPolls([pollDetails]);
      // Replace the existing poll details with the latest one
    } else {
      console.log("No polls found");
    }
  };

  useEffect(() => {
    fetchPollDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId, pollDetails]);

  const handleCreatePoll = async () => {
    if (question && options.length > 1) {
      try {
        await createPoll({
          functionName: "createPoll",
          args: [question, options],
        });
        setQuestion("");
        setOptions(["", ""]);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleVote = async () => {
    if (selectedPoll !== null && selectedOption !== null) {
      try {
        await vote({
          functionName: "vote",
          args: [BigInt(pollId), BigInt(selectedOption)],
        });
        setSelectedPoll(null);
        setSelectedOption(null);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Create a Poll</h2>
        <input
          type="text"
          className="input input-bordered w-full mb-2"
          placeholder="Enter your poll question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        {options.map((option, index) => (
          <input
            key={index}
            type="text"
            className="input input-bordered w-full mb-2"
            placeholder={`Option ${index + 1}`}
            value={option}
            onChange={e => {
              const newOptions = [...options];
              newOptions[index] = e.target.value;
              setOptions(newOptions);
            }}
          />
        ))}
        <button className="btn btn-primary mb-2" onClick={() => setOptions([...options, ""])}>
          Add Option
        </button>
        <button className="btn btn-accent" onClick={handleCreatePoll}>
          Create Poll
        </button>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Active Polls</h2>
        <button className="btn btn-secondary mb-4" onClick={fetchPollDetails}>
          Fetch Polls
        </button>
        {polls.map((poll, index) => (
          <div key={index} className="card bg-base-100 shadow-xl mb-4">
            <div className="card-body">
              <h2 className="card-title">{pollDetails?.[0]}</h2>
              <div className="form-control">
                {pollDetails?.[1].map((option: string, i: number) => (
                  <label key={i} className="label cursor-pointer">
                    <span className="label-text">{option}</span>
                    <input
                      type="radio"
                      name={`option-${index}`}
                      className="radio"
                      checked={selectedPoll === index && selectedOption === i}
                      onChange={() => {
                        setSelectedPoll(index);
                        setSelectedOption(i);
                      }}
                    />
                  </label>
                ))}
              </div>
              <button className="btn btn-primary mt-2" onClick={handleVote}>
                Vote
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Poll Events</h2>
        <PollEvents />
      </div>
    </div>
  );
};

export default PublicFeedback;

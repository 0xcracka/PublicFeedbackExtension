import React, { useMemo } from "react";
import { Log } from "viem";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

type ScaffoldEventData = {
  args: any;
  receiptData: any;
  eventName: React.ReactNode;
  log: Log<bigint, number, false>;
};

const PollEvents = () => {
  const {
    data: pollCreatedEvents,
    isLoading: isLoadingPollCreated,
    error: errorReadingPollCreated,
  } = useScaffoldEventHistory({
    contractName: "PollingContract",
    eventName: "PollCreated",
    fromBlock: 31231n,
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
    fromBlock: 31231n,
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Poll Events</h1>

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

export default PollEvents;

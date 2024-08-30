// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract PollingContract {

    address public owner;

    struct Poll {
        string question;
        string[] options;
        mapping(uint => uint) votes;  // Maps option index to vote count
        bool exists;  // To ensure poll exists
    }

    mapping(uint => Poll) public polls;  // Maps poll ID to Poll struct
    mapping(uint => mapping(address => bool)) public hasVoted; // Maps poll ID to voter address to voted status
    uint public pollCount;

    event PollCreated(uint pollId, string question, string[] options);
    event VoteCasted(uint pollId, uint optionIndex);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function.");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Owner address cannot be the zero address.");
        owner = _owner;
    }

    // Function to create a new poll, restricted to owner
    function createPoll(string memory _question, string[] memory _options) public onlyOwner {
        require(_options.length > 1, "A poll must have at least two options.");

        Poll storage newPoll = polls[pollCount];
        newPoll.question = _question;
        newPoll.options = _options;
        newPoll.exists = true;

        emit PollCreated(pollCount, _question, _options);
        pollCount++;
    }

    // Function to vote on a poll
    function vote(uint _pollId, uint _optionIndex) public {
        require(polls[_pollId].exists, "Poll does not exist.");
        require(!hasVoted[_pollId][msg.sender], "You have already voted in this poll.");
        require(_optionIndex < polls[_pollId].options.length, "Invalid option.");

        polls[_pollId].votes[_optionIndex]++;
        hasVoted[_pollId][msg.sender] = true;

        emit VoteCasted(_pollId, _optionIndex);
    }

    // Function to view the results of a poll
    function viewResults(uint _pollId) public view returns (string memory, uint[] memory) {
        require(polls[_pollId].exists, "Poll does not exist.");

        uint[] memory results = new uint[](polls[_pollId].options.length);

        for (uint i = 0; i < polls[_pollId].options.length; i++) {
            results[i] = polls[_pollId].votes[i];
        }

        return (polls[_pollId].question, results);
    }

    // Function to get poll details
    function getPollDetails(uint _pollId) public view returns (string memory question, string[] memory options) {
        require(polls[_pollId].exists, "Poll does not exist.");

        return (polls[_pollId].question, polls[_pollId].options);
    }
}

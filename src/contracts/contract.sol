// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Counter is Ownable {
    IERC20 public immutable token;
    uint256 public totalCount;
    uint256 public tokenAmount = 2000000000000000000; // 2 tokens with 18 decimals
    mapping(address => uint256) public userCounts;
    mapping(address => uint256) public lastIncrementTimestamp;

    event CounterIncremented(address indexed user, uint256 newCount);
    event TokenAmountUpdated(uint256 newAmount);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
    }

    // Function to increment counter and transfer tokens (with 1-hour cooldown)
    function incrementCounter() external {
        require(
            block.timestamp >= lastIncrementTimestamp[msg.sender] + 1 hours,
            "Can only increment once per hour"
        );
        totalCount++;
        userCounts[msg.sender]++;
        lastIncrementTimestamp[msg.sender] = block.timestamp;

        // Transfer tokens to the user
        require(token.transfer(msg.sender, tokenAmount), "Token transfer failed");

        emit CounterIncremented(msg.sender, totalCount);
    }

    // Function to update token amount (only owner)
    function updateTokenAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > 0, "Amount must be greater than 0");
        tokenAmount = _newAmount;
        emit TokenAmountUpdated(_newAmount);
    }

    // Function to deposit tokens into the contract (only owner)
    function depositTokens(uint256 amount) external onlyOwner {
        require(token.transferFrom(msg.sender, address(this), amount), "Token deposit failed");
    }

    // Function to read total count
    function getTotalCount() external view returns (uint256) {
        return totalCount;
    }

    // Function to read count by wallet address
    function getUserCount(address _user) external view returns (uint256) {
        return userCounts[_user];
    }

    // Function to read last increment timestamp
    function getLastIncrementTimestamp(address _user) external view returns (string memory) {
        if (lastIncrementTimestamp[_user] == 0) {
            return "never";
        }
        return uintToString(lastIncrementTimestamp[_user]);
    }

    // Function to check contract's token balance
    function getContractTokenBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    // Helper function to convert uint to string
    function uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 j = v;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (v != 0) {
            k = k - 1;
            uint8 temp = uint8(48 + (v % 10));
            bstr[k] = bytes1(temp);
            v /= 10;
        }
        return string(bstr);
    }
}
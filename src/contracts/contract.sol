// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DegenCounter is Ownable {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;
    uint256 public totalCount;
    uint256 public tokenAmount = 1000000000000000000; // 1 DEGEN (18 decimals)
    mapping(address => uint256) public userCounts;
    mapping(address => uint256) public lastIncrementTimestamp;

    event CounterIncremented(address indexed user, uint256 newCount);
    event TokenAmountUpdated(uint256 newAmount);
    event TokensDeposited(address indexed sender, uint256 amount);

    constructor() Ownable(msg.sender) {
        token = IERC20(0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed); // DEGEN token address
    }

    function incrementCounter() external {
        require(
            block.timestamp >= lastIncrementTimestamp[msg.sender] + 6 hours,
            "Can only increment once per 6 hours"
        );
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient balance");
        totalCount++;
        userCounts[msg.sender]++;
        lastIncrementTimestamp[msg.sender] = block.timestamp;

        token.safeTransfer(msg.sender, tokenAmount);

        emit CounterIncremented(msg.sender, totalCount);
    }

    function updateTokenAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > 0, "Amount must be greater than 0");
        tokenAmount = _newAmount;
        emit TokenAmountUpdated(_newAmount);
    }

    function depositTokens(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(msg.sender, amount);
    }

    function getTotalCount() external view returns (uint256) {
        return totalCount;
    }

    function getUserCount(address _user) external view returns (uint256) {
        return userCounts[_user];
    }

    function getLastIncrementTimestamp(address _user) external view returns (string memory) {
        if (lastIncrementTimestamp[_user] == 0) {
            return "never";
        }
        return uintToString(lastIncrementTimestamp[_user]);
    }

    function getContractTokenBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

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
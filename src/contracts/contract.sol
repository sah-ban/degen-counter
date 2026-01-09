// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract DegenCounter is Ownable, EIP712 {
    using SafeERC20 for IERC20;
    
    error InvalidSignature();
    error InvalidSigner();

    IERC20 public immutable token;
    address public immutable SIGNER;
    uint256 public totalCount;
    uint256 public tokenAmount = 1000000000000000000; // 1 DEGEN (18 decimals)
    uint256 public cooldownHours = 6;
    
    // Mappings keyed by FID (uint256) instead of address
    mapping(uint256 => uint256) public fidCounts;
    mapping(uint256 => uint256) public lastFidIncrementTimestamp;
    mapping(uint256 => uint256) public fidNonces;

    bytes32 public constant INCREMENT_TYPEHASH = keccak256("Increment(address user,uint256 fid,uint256 nonce)");

    event CounterIncremented(address indexed user, uint256 newCount, uint256 fid);
    event TokenAmountUpdated(uint256 newAmount);
    event TokensDeposited(address indexed sender, uint256 amount);
    event CooldownUpdated(uint256 newCooldownHours);

    constructor(address _signer) Ownable(msg.sender) EIP712("DegenCounter", "1") {
        token = IERC20(0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed); // DEGEN token address
        require(_signer != address(0), "Invalid signer");
        SIGNER = _signer;
    }

    function incrementCounter(uint256 fid, bytes calldata signature) external {
        if (block.timestamp < lastFidIncrementTimestamp[fid] + (cooldownHours * 1 hours)) {
             revert("Can only increment once per cooldown period");
        }
        // Verify Signature
        // We still include msg.sender in the hash to ensure the FID holder intended THIS wallet to receive tokens
        bytes32 structHash = keccak256(
            abi.encode(
                INCREMENT_TYPEHASH,
                msg.sender,
                fid,
                fidNonces[fid]
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = ECDSA.recover(digest, signature);
        
        if (recoveredSigner != SIGNER) {
            revert InvalidSignature();
        }

        // Update state
        fidNonces[fid]++;
        totalCount++;
        fidCounts[fid]++;
        lastFidIncrementTimestamp[fid] = block.timestamp;

        if (token.balanceOf(address(this)) >= tokenAmount) {
            token.safeTransfer(msg.sender, tokenAmount);
        }

        emit CounterIncremented(msg.sender, totalCount, fid);
    }

    function updateTokenAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > 0, "Amount must be greater than 0");
        tokenAmount = _newAmount;
        emit TokenAmountUpdated(_newAmount);
    }

    function updateCooldown(uint256 _hours) external onlyOwner {
        cooldownHours = _hours;
        emit CooldownUpdated(_hours);
    }

    function depositTokens(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(msg.sender, amount);
    }

    function getTotalCount() external view returns (uint256) {
        return totalCount;
    }

    function getFidCount(uint256 fid) external view returns (uint256) {
        return fidCounts[fid];
    }

    function getLastFidIncrementTimestamp(uint256 fid) external view returns (string memory) {
        if (lastFidIncrementTimestamp[fid] == 0) {
            return "never";
        }
        return uintToString(lastFidIncrementTimestamp[fid]);
    }

    function getContractTokenBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getCooldownRemaining(uint256 fid) external view returns (uint256) {
        uint256 lastIncrement = lastFidIncrementTimestamp[fid];
        if (lastIncrement == 0) {
            return 0; // Never incremented, no cooldown
        }
        
        uint256 cooldownEnd = lastIncrement + (cooldownHours * 1 hours);
        if (block.timestamp >= cooldownEnd) {
            return 0; // Cooldown expired
        }
        
        return cooldownEnd - block.timestamp; // Seconds remaining
    }

    // Helper for debugging/frontend to generate hash
    function getStructHash(address user, uint256 fid) public view returns (bytes32) {
        return keccak256(
            abi.encode(
                INCREMENT_TYPEHASH,
                user,
                fid,
                fidNonces[fid]
            )
        );
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
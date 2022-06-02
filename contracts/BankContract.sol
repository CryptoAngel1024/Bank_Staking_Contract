// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract BankContract is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.UintSet;

    struct StakeStruct {
        uint256 amount;
        address stakeUser;
    }

    EnumerableSet.UintSet stakeIds;
    mapping(uint256 => StakeStruct) stakes;
    mapping(address => EnumerableSet.UintSet) private ownedDeposits;

    uint256 public currentDepositId = 0;
    uint256 public totalStakeAmount = 0;
    uint256 public R1 = 200;   // 20%
    uint256 public R2 = 300;   // 30%
    uint256 public R3 = 500;   // 50%
    uint256 public initDepositValue = 0;
    uint256 public stakePeriod = 0;
    uint256 public startTime = 0;
    IERC20 stakingToken;

    constructor(uint256 period, address tokenAddress) {
        require(period > 0, "Need no zero period");
        stakePeriod = period;
        stakingToken = IERC20(tokenAddress);
        startTime = block.timestamp;
    }

    function setRewardRates(uint256 _R1, uint256 _R2, uint256 _R3) external onlyOwner nonReentrant {
        require(_R1 < 1000, "R1 error");
        require(_R2 < 1000, "R2 error");
        require(_R3 < 1000, "R3 error");
        R1 = _R1;
        R2 = _R2;
        R3 = _R3;
    }

    function initDeposit(uint256 R) external onlyOwner nonReentrant {
        stakingToken.transferFrom(msg.sender, address(this), R);
        initDepositValue = R;
    }

    function withdrawFunds() external onlyOwner nonReentrant {
        require(block.timestamp - startTime > stakePeriod * 4, "No time to withdraw for owner");
        require(stakeIds.length() == 0, "Still stakes exit");
        uint256 balance = stakingToken.balanceOf(address(this));
        stakingToken.transfer(msg.sender, balance);
    }

    // deposit funds by user, add pool
    function deposit(uint256 amount) external nonReentrant {
        require(block.timestamp > startTime, "time error");
        require(block.timestamp - startTime < stakePeriod, "It is not time to deposit");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakes[currentDepositId] = StakeStruct(amount, msg.sender);
        ownedDeposits[msg.sender].add(currentDepositId);
        stakeIds.add(currentDepositId);
        currentDepositId ++;
        totalStakeAmount += amount;
    }

    // withdraw by deposit id
    function withdraw(uint256 id) external nonReentrant {
        StakeStruct memory stake = stakes[id];
        require(stake.stakeUser == msg.sender, "Only owner can withdraw his token");
        uint256 amountToWithdraw = stake.amount.add(getReward(id));
        uint256 balance = stakingToken.balanceOf(address(this));
        if (amountToWithdraw > balance) {
            amountToWithdraw = balance;
        }
        stakingToken.transfer(msg.sender, amountToWithdraw);
        stakeIds.remove(id);
        ownedDeposits[msg.sender].remove(id);
        totalStakeAmount -= stake.amount;
        delete stakes[id];
    }

    function getReward(uint256 id) public view returns (uint256) {
        require(stakeIds.length() > 0, "No stake");
        uint256 time = block.timestamp - startTime;
        uint256 stakeAmount = stakes[id].amount;
        if (time.div(stakePeriod) >= 4) {
            return initDepositValue.mul(R1 + R2 + R3).div(1000).mul(stakeAmount).div(totalStakeAmount);
        } else if (time.div(stakePeriod) >= 3) {
            return initDepositValue.mul(R1 + R2).div(1000).mul(stakeAmount).div(totalStakeAmount);
        } else if (time.div(stakePeriod) >= 2) {
            return initDepositValue.mul(R1).div(1000).mul(stakeAmount).div(totalStakeAmount);
        } else {
            revert("No withdraw time");
        }
    }

    function getOwnedStakes (address staker) public view returns(uint256[] memory) {
        return ownedDeposits[staker].values();
    }

    
}

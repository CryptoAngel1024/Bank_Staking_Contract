// This is test for owner withdraw after 4T.

const ethers = require('ethers');
const BankContract = artifacts.require('BankContract.sol');
const XYZToken = artifacts.require('XYZToken.sol');
const {
  advanceBlock,
  advanceToBlock,
  increaseTime,
  increaseTimeTo,
  duration,
  revert,
  latestTime,
} = require('truffle-test-helpers');

const STANDARD_TIME_OFFSET = 20;
require('chai').use(require('chai-as-promised')).should();

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

contract('TestTruffle Contract', async (accounts) => {
  let bankContract;
  let xyzToken;

  before(async () => {
    console.log('init', accounts);
    xyzToken = await XYZToken.deployed();
    bankContract = await BankContract.new(
      STANDARD_TIME_OFFSET.toString(),
      xyzToken.address
    );
    console.log('deployed', bankContract.address, xyzToken.address);
    const amount = ethers.utils.parseUnits('1000', 'ether');

    await xyzToken.mint(accounts[0], amount.toString());
    const balance0 = await xyzToken.balanceOf(accounts[0]);
    console.log('minted account 0', balance0.toString());

    await xyzToken.mint(accounts[1], amount.toString());
    const balance1 = await xyzToken.balanceOf(accounts[1]);
    console.log('minted account 1', balance1.toString());

    const amount1 = ethers.utils.parseUnits('100', 'ether');
    await xyzToken.approve(bankContract.address, amount.toString());
    console.log('approved', amount1.toString());
    await bankContract.initDeposit(amount1.toString());
    console.log('R = ', amount1.toString());
    const R1 = await bankContract.R1.call();
    const R2 = await bankContract.R2.call();
    const R3 = await bankContract.R3.call();
    console.log('R1 = ', R1);
    console.log('R2 = ', R2);
    console.log('R3 = ', R3);

    const depositAmount1 = ethers.utils.parseUnits('100', 'ether');
    const depositAmount2 = ethers.utils.parseUnits('400', 'ether');

    // deposit 100 eth with account 0
    await xyzToken.approve(bankContract.address, depositAmount1.toString());
    await bankContract.deposit(depositAmount1.toString());
    console.log('deposit id 0 amount = ', depositAmount1.toString());

    // deposit 400 eth with account 1
    await xyzToken.approve(bankContract.address, depositAmount2.toString(), {
      from: accounts[1],
    });
    console.log('approved account 1', depositAmount2.toString());
    await bankContract.deposit(depositAmount2.toString(), {
      from: accounts[1],
    });
    console.log('deposit id 1 amount = ', depositAmount1.toString());

    const totalStake = await bankContract.totalStakeAmount.call();
    console.log('total stake is ', totalStake.toString());

    const balance = await xyzToken.balanceOf(bankContract.address);
    console.log('total balance is ', balance.toString());
  });

  it('withdraw', async () => {
    console.log('withdraw');

    const period = await bankContract.stakePeriod.call();
    console.log('period', period.toString());

    await increaseTime(duration.seconds(2 * STANDARD_TIME_OFFSET + 1));

    const reward1 = await bankContract.getReward('0');
    console.log('reward1', reward1);
    // withdraw between 2T ~ 3T with R1/R rate
    const beforeBalance = await xyzToken.balanceOf(accounts[0]);
    await bankContract.withdraw('0', { from: accounts[0] });
    const afterBalance = await xyzToken.balanceOf(accounts[0]);
    console.log(
      'withdrawn from account 0 on 2T, ',
      (Number(afterBalance) - Number(beforeBalance)).toString()
    );

    // withdraw between 3T ~ 4T with R1 + R2/R rate
    await increaseTime(duration.seconds(STANDARD_TIME_OFFSET));
    const reward2 = await bankContract.getReward('0');
    console.log('reward2', reward2);
    const beforeBalance2 = await xyzToken.balanceOf(accounts[1]);
    await bankContract.withdraw('1', { from: accounts[1] });
    console.log('withdrawn');
    const afterBalance2 = await xyzToken.balanceOf(accounts[1]);
    console.log(
      'withdrawn from account 1 on 3T, ',
      (afterBalance2 - beforeBalance2).toString()
    );

    // withdraw remained token 4T +
    await increaseTime(duration.seconds(STANDARD_TIME_OFFSET));
    const beforeBalance3 = await xyzToken.balanceOf(accounts[0]);
    await bankContract.withdrawFunds();
    console.log('withdraw Fund');
    const afterBalance3 = await xyzToken.balanceOf(accounts[0]);
    console.log(
      'owner withdrawn on 4T +, ',
      (afterBalance3 - beforeBalance3).toString()
    );

    // state of contract

    const totalStake = await bankContract.totalStakeAmount.call();
    console.log('total stake is ', totalStake.toString());

    const balance = await xyzToken.balanceOf(bankContract.address);
    console.log('total balance is ', balance.toString());
  });
});

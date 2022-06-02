// This is test for owner withdraw after 4T.

const ethers = require('ethers');
const BankContract = artifacts.require('BankContract.sol');
const XYZToken = artifacts.require('XYZToken.sol');

const STANDARD_TIME_OFFSET = 100;
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
    console.log('init finished');
  });

  it('deposit', async () => {
    console.log('deposit');

    const depositAmount1 = ethers.utils.parseUnits('100', 'ether');
    const depositAmount2 = ethers.utils.parseUnits('400', 'ether');

    // deposit 100 eth with account 0
    await xyzToken.approve(bankContract.address, depositAmount1.toString());
    await bankContract.deposit(depositAmount1.toString());
    console.log('deposited', accounts[0]);

    // deposit 400 eth with account 1
    await xyzToken.approve(bankContract.address, depositAmount2.toString(), {
      from: accounts[1],
    });
    console.log('approved account 1', depositAmount2.toString());
    await bankContract.deposit(depositAmount2.toString(), {
      from: accounts[1],
    });
    console.log('deposited account 1', accounts[1]);

    const totalStake = await bankContract.totalStakeAmount.call();
    console.log('total stake is ', totalStake.toString());

    const balance = await xyzToken.balanceOf(bankContract.address);
    console.log('total balance is ', balance.toString());
  });
});

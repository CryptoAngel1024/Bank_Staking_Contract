const BankContract = artifacts.require('BankContract');

module.exports = function (deployer) {
  deployer.deploy(
    BankContract,
    100000, // this is staking period (T) as second value
    '0x98d9a611ad1b5761bdc1daac42c48e4d54cf5882' // rinkeby ATRAC
  );
};

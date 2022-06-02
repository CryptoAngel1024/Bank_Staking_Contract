const BankContract = artifacts.require('BankContract');

module.exports = function (deployer) {
  deployer.deploy(
    BankContract,
    10,
    '0x02177a49bc9A0893204687565808A0bD1C776526'
  );
};

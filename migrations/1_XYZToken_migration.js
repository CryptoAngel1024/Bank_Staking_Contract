const XYZToken = artifacts.require('XYZToken');

module.exports = function (deployer) {
  deployer.deploy(XYZToken);
};

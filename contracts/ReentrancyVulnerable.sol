// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReentrancyVulnerable {

    mapping(address => uint256) public balances;

    // ✅ NEW: appointment storage
    mapping(address => uint256) public appointments;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // 🔴 Vulnerable withdraw function
    function withdraw() external {

        uint256 amount = balances[msg.sender];

        (bool success,) = msg.sender.call{value: amount}("");
        require(success);

        balances[msg.sender] = 0;
    }

    // ✅ NEW: book appointment
    function bookAppointment(uint256 _time) public payable {
        require(msg.value == 1 ether, "Must pay 1 ETH");

        appointments[msg.sender] = _time;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReentrancyVulnerable {

    mapping(address => uint256) public balances;

    struct Appointment {
        address patient;
        string doctor;
        uint8 purpose;
        uint256 time;
    }

    mapping(address => Appointment[]) public myAppointments;
    Appointment[] public allAppointments;

    // DEPOSIT
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // WITHDRAW (still vulnerable for demo)
    function withdraw() external {
        uint256 amount = balances[msg.sender];

        (bool success,) = msg.sender.call{value: amount}("");
        require(success);

        balances[msg.sender] = 0;
    }

    // BOOK APPOINTMENT
    function bookAppointment(
        string memory _doctor,
        uint8 _purpose,
        uint256 _time
    ) public {

        Appointment memory newAppointment = Appointment(
            msg.sender,
            _doctor,
            _purpose,
            _time
        );

        myAppointments[msg.sender].push(newAppointment);
        allAppointments.push(newAppointment);
    }

    // GET MY APPOINTMENTS
    function getMyAppointments() public view returns (Appointment[] memory) {
        return myAppointments[msg.sender];
    }

    // GET ALL APPOINTMENTS (for doctor)
    function getAllAppointments() public view returns (Appointment[] memory) {
        return allAppointments;
    }

    // CANCEL
    function cancelAppointment(uint index) public {
        require(index < myAppointments[msg.sender].length, "Invalid index");

        delete myAppointments[msg.sender][index];
    }
}
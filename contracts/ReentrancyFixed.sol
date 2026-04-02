// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Healthcare {

    mapping(address => uint256) public balances;

    // doctor + time slot
    mapping(string => mapping(uint256 => bool)) public bookedSlots;

    enum AppointmentType {
        General,
        BloodPressure,
        Sugar,
        Dental,
        Eye,
        Skin,
        Cardiology
    }

    struct Appointment {
        address patient;
        string doctor;
        AppointmentType appointmentType;
        uint256 time;
    }

    Appointment[] public appointments;

    // 💰 Deposit
    function deposit() public payable {
        require(msg.value > 0, "Send ETH");
        balances[msg.sender] += msg.value;
    }

    // 💸 Withdraw
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        balances[msg.sender] = 0;

        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    // 🏥 Book Appointment
    function bookAppointment(
        string memory _doctor,
        uint8 _type,
        uint256 _time
    ) public {

        require(balances[msg.sender] > 0, "Deposit first");
        require(_time > block.timestamp, "Invalid time");

        // ✅ SAME doctor + SAME time block (already correct)
        require(!bookedSlots[_doctor][_time], "Doctor already booked");

        appointments.push(Appointment(
            msg.sender,
            _doctor,
            AppointmentType(_type),
            _time
        ));

        bookedSlots[_doctor][_time] = true;
    }

    // ❌ Cancel Appointment
    function cancelAppointment(uint index) public {
        require(index < appointments.length, "Invalid index");

        // ✅ FIX: patient check first (IMPORTANT)
        require(appointments[index].patient == msg.sender, "Not yours");

        // free slot
        bookedSlots[
            appointments[index].doctor
        ][appointments[index].time] = false;

        // ✅ FIX: swap + pop safely
        uint lastIndex = appointments.length - 1;

        if (index != lastIndex) {
            appointments[index] = appointments[lastIndex];
        }

        appointments.pop();
    }

    // 👀 Get My Appointments
    function getMyAppointments() public view returns (Appointment[] memory) {
        uint count = 0;

        for (uint i = 0; i < appointments.length; i++) {
            if (appointments[i].patient == msg.sender) {
                count++;
            }
        }

        Appointment[] memory result = new Appointment[](count);
        uint j = 0;

        for (uint i = 0; i < appointments.length; i++) {
            if (appointments[i].patient == msg.sender) {
                result[j] = appointments[i];
                j++;
            }
        } // ✅ loop close here

        return result; // ✅ correct place
    }

    // 👨‍⚕️ Doctor function
    function getAllAppointments() public view returns (Appointment[] memory) {
        return appointments;
    }
}
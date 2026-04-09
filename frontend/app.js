const contractAddress ="0x5FbDB2315678afecb367f032d93F642f64180aa3";

let provider;
let signer;
let contract;
let originalData = null;
let role = "patient";

let currentFilter = "all";

const doctorInfo = {
    "Dr Nirmala Tamang": { rating: 4.8, distance: "5 km" },
    "Dr Binod": { rating: 4.5, distance: "22 km" },
    "Dr Pranika": { rating: 4.2, distance: "10 km" },
    "Dr Sita": { rating: 4.6, distance: "3 km" },
    "Dr Pema": { rating: 4.1, distance: "8 km" },
    "Dr Nima": { rating: 4.3, distance: "6 km" },
    "Dr Asmin": { rating: 4.4, distance: "4 km" }
};
const doctorSpecialization = {
    "Dr Nirmala Tamang": "❤️ Cardiology",
    "Dr Binod": "🦷 Dentistry",
    "Dr Pranika": "🩺 General",
    "Dr Sita": "👁 Ophthalmology",
    "Dr Pema": "🧴 Dermatology",
    "Dr Nima": "💓 Hypertension",
    "Dr Asmin": "🧪 Diabetes"
};

const femaleDoctors = [
    "Dr Nirmala Tamang",
    "Dr Pema",
    "Dr Pranika",
    "Dr Sita"
];

// TIME CATEGORY
function getTimeCategory(hour) {
    if (hour >= 6 && hour < 12) return "🌅 Morning";
    if (hour >= 12 && hour < 17) return "☀️ Afternoon";
    if (hour >= 17 && hour < 19) return "🌇 Evening";
     return "";
}

// STATUS
function setStatus(message) {
    document.getElementById("status").innerText = message;
}

// CLOSE
function closeAppointments() {
    document.getElementById("appointmentsContainer").innerHTML = "";
}

// ✅ FIXED CONNECT WALLET
async function connectWallet() {
    try {

        if (!window.ethereum) {
            setStatus("❌ MetaMask not installed");
            return;
        }

        setStatus("⏳ Connecting wallet...");

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);

        signer = provider.getSigner();
        const address = await signer.getAddress();

        document.getElementById("walletAddress").innerText =
            "💖 Connected: " + address;

        contract = new ethers.Contract(contractAddress, [
            "function deposit() payable",
            "function withdraw()",
            "function bookAppointment(string,uint8,uint256)",
            "function getMyAppointments() view returns (tuple(address,string,uint8,uint256)[])",
            "function getAllAppointments() view returns (tuple(address,string,uint8,uint256)[])",
            "function cancelAppointment(uint)",

            // ✅ ADD THIS LINE 👇
            "function updateAppointment(uint,string,uint8,uint256)"
        ], signer);


        setStatus("🔗 Wallet Connected (Select role)");

    } catch (e) {
        console.error(e);
        setStatus("❌ Wallet connection failed");
    }
}

// ✅ FIXED DEPOSIT
async function deposit() {
    try {

        role = document.getElementById("userRole").value;

        if (!role) {
            setStatus("⚠️ Please select a role first");
            return;
        }

        if (!contract) {
            setStatus("⚠️ Connect wallet first");
            return;
        }

        setStatus("⏳ Sending transaction...");

        const tx = await contract.deposit({
            value: ethers.utils.parseEther("1")
        });

        setStatus("⏳ Waiting for confirmation...");
        await tx.wait();

        if (role === "doctor") {

            document.getElementById("bookBtn").style.display = "none";
            document.getElementById("doctor").style.display = "none";
            document.getElementById("purpose").style.display = "none";
            document.getElementById("appointmentTime").style.display = "none";

            setStatus("👨‍⚕️ Doctor mode + Deposit successful");
            viewAppointment();

        } else if (role === "patient") {

            document.getElementById("bookBtn").style.display = "block";
            document.getElementById("doctor").style.display = "block";
            document.getElementById("purpose").style.display = "block";
            document.getElementById("appointmentTime").style.display = "block";

            setStatus("👤 Patient mode + Deposit successful 🎉");
        }

    } catch (e) {
        console.error(e);
        setStatus("❌ Deposit failed");
    }
}

// WITHDRAW
async function withdraw() {
    try {
        const tx = await contract.withdraw();
        await tx.wait();
        setStatus("💸 Withdraw successful!");
    } catch (e) {
        console.error(e);
        setStatus("❌ Withdraw failed");
    }
}

// BOOK
async function book() {
    role = document.getElementById("userRole").value;

    if (role === "doctor") {
        setStatus("❌ Doctor cannot book");
        return;
    }

    try {
        const doctor = document.getElementById("doctor").value;
        const type = parseInt(document.getElementById("purpose").value);
        const input = document.getElementById("appointmentTime").value;

        if (!doctor || isNaN(type) || !input) {
            setStatus("⚠️ Fill all fields");
            return;
        }

        const [datePart, timePart] = input.split("T");
        const [year, month, day] = datePart.split("-");
        const [hour, minute] = timePart.split(":");

        const selectedDate = new Date(year, month - 1, day, hour, minute);
        if (selectedDate <= new Date()) {
            setStatus("⚠️ Select future time");
            return;
        }

        const time = Math.floor(selectedDate.getTime() / 1000);

       const selectedHour = selectedDate.getHours();

if (selectedHour < 6 || selectedHour > 19) {
    setStatus("⚠️ Booking allowed only from 6 AM to 7 PM");
    return;
}
        setStatus("⏳ Booking...");
        const tx = await contract.bookAppointment(doctor, type, time);
        await tx.wait();

        setStatus("🎉 Appointment booked!");

        /// ✅ RESET FORM PROPERLY
         document.getElementById("doctor").selectedIndex = 0;
         document.getElementById("purpose").selectedIndex = 0;
         document.getElementById("appointmentTime").value = "";
         document.getElementById("appointmentId").value = "";

         // ✅ LOAD APPOINTMENTS
         await viewAppointment();

         // ✅ SCROLL DOWN
         document.getElementById("appointmentsContainer").scrollIntoView({
           behavior: "smooth"
         });
         } catch (e) {
             console.error(e);
             setStatus("❌ Booking failed");
         }
         }


// VIEW APPOINTMENT
async function viewAppointment() {
    try {

        let data = role === "doctor"
            ? await contract.getAllAppointments()
            : await contract.getMyAppointments();
            if (currentFilter === "all") setStatus("📋 All Appointments");
            if (currentFilter === "upcoming") setStatus("🟢 Upcoming Appointments");
            if (currentFilter === "past") setStatus("🔴 Past Appointments");

        const now = Math.floor(Date.now() / 1000);

        data = data.filter((a) => {
            const time = Number(a[3]);
            const hour = new Date(time * 1000).getHours();


            if (hour < 6 || hour > 19) return false;

            // 🔍 apply filter
            if (currentFilter === "upcoming") return time > now;
            if (currentFilter === "past") return time <= now;

            return true;
        });

        // ✅ EMPTY MESSAGE
        if (data.length === 0) {
            let msg = currentFilter === "past"
                ? "🔴 No past appointments"
                : currentFilter === "upcoming"
                ? "🟢 No upcoming appointments"
                : "📭 No appointments";

            document.getElementById("appointmentsContainer").innerHTML =
                `<p style="text-align:center;">${msg}</p>`;
            return;
        }

        let output = `
        <div style="text-align:right;">
            <button onclick="closeAppointments()">❌ Close</button>
        </div>`;

        data.forEach((a, i) => {

            const appointmentTime = Number(a[3]);
            const isPast = appointmentTime <= now;

            let statusColor = "";
            let statusText = "";

            if (currentFilter !== "all") {
                statusColor = isPast ? "#ef4444" : "#22c55e";
                statusText = isPast ? "🔴 Past" : "🟢 Upcoming";
            }

            const doctor = a[1];
            const time = new Date(appointmentTime * 1000);

            const readable = time.toLocaleString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });

            const category = getTimeCategory(time.getHours());

            const info = doctorInfo[doctor] || { rating: 4.0, distance: "N/A" };

            const image = femaleDoctors.includes(doctor)
                ? "female.png"
                : "male.png";

            output += `
            <div style="margin:10px;padding:15px;border-radius:15px;border:1px solid #eee;background:#fff;">
                <b>📌 Appointment #${i + 1}</b>
                ${currentFilter !== "all" ? `
                <span style="float:right;color:${statusColor};">
                    ${statusText}
                </span>
                ` : ""}<br><br>

                <img src="${image}" style="width:45px;height:45px;border-radius:50%;"><br>

                <b>${doctor}</b><br>
                ${doctorSpecialization[doctor] || ""}<br>
                ⭐ ${info.rating} 📍 ${info.distance}<br>

                📅 ${readable} • ${category}<br>

                ${role === "patient" && !isPast ? `
                    <button onclick="cancelByIndex(${i})">❌ Cancel</button>
                    <button onclick="editAppointment(${i}, '${doctor}', ${a[2]}, ${appointmentTime})">✏️ Edit</button>
                ` : ""}
                </div>`;
        });

        document.getElementById("appointmentsContainer").innerHTML = output;

    } catch (e) {
        console.error(e);
        setStatus("❌ Error loading appointments");
    }
}

async function updateAppointment() {
  try {
    const index = document.getElementById("appointmentId").value;
    const doctor = document.getElementById("doctor").value;
    const type = document.getElementById("purpose").value;
    const timeInput = document.getElementById("appointmentTime").value;

    // ✅ Only patient allowed
    if (role !== "patient") {
      alert("❌ Only patient can update appointment");
      return;
    }

    // ✅ Validate fields
    if (index === "" || doctor === "" || timeInput === "") {
      alert("⚠️ Please fill all fields");
      return;
    }

    // ✅ Validate purpose
    if (type === "" || isNaN(type)) {
      alert("⚠️ Please select a valid purpose");
      return;
    }

    // ✅ Convert time
    const time = Math.floor(new Date(timeInput).getTime() / 1000);

    if (isNaN(time)) {
      alert("⚠️ Invalid time selected");
      return;
    }

    // ✅ Future time check (VERY IMPORTANT)
    if (time <= Math.floor(Date.now() / 1000)) {
      alert("⚠️ Select future time");
      return;
    }

    // ✅ Debug logs
    console.log("INDEX:", index);
    console.log("DOCTOR:", doctor);
    console.log("TYPE:", type);
    console.log("TIME:", time);

    if (!originalData) {
      alert("⚠️ Please click edit first");
      return;
    }
    if (
      originalData.doctor === doctor &&
      originalData.type === String(type) &&
      originalData.time === String(time)
    ) {
      alert("⚠️ Please change something before updating");
      return;
    }

    // ✅ Call contract
    const tx = await contract.updateAppointment(index, doctor, type, time);
    await tx.wait();

    alert("✅ Appointment updated!");

    // ✅ Reset form after update
    document.getElementById("doctor").selectedIndex = 0;
    document.getElementById("purpose").selectedIndex = 0;
    document.getElementById("appointmentTime").value = "";
    document.getElementById("appointmentId").value = "";

    // ✅ Refresh UI
    await viewAppointment();

  } catch (err) {
    console.error(err);
    alert(
      err.reason ||
      err.data?.message ||
      err.message ||
      "Unknown error"
    );
  }
}

function editAppointment(index, doctor, type, time) {


console.log("EDIT CLICKED", index, doctor, type, time); //

  document.getElementById("appointmentId").value = index;
  document.getElementById("doctor").value = doctor;
  document.getElementById("purpose").value = type;

  const date = new Date(time * 1000);

  const formatted =
    date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, '0') + "-" +
    String(date.getDate()).padStart(2, '0') + "T" +
    String(date.getHours()).padStart(2, '0') + ":" +
    String(date.getMinutes()).padStart(2, '0');

  document.getElementById("appointmentTime").value = formatted;
  // ✅ STORE ORIGINAL DATA
    originalData = {
      doctor: doctor,
      type: String(type),
      time: String(time)
    };

    window.scrollTo({ top: 0, behavior: "smooth" });
  }


// CANCEL
async function cancelByIndex(index) {
    try {

        // ✅ CONFIRMATION POPUP
        const confirmCancel = confirm("Are you sure you want to cancel this appointment?");

        if (!confirmCancel) {
            return; // ❌ user clicked Cancel
        }

        const tx = await contract.cancelAppointment(index);
        await tx.wait();

        setStatus("❌ Appointment Cancelled");
        viewAppointment();

    } catch (e) {
        console.error(e);
        setStatus("❌ Cancel failed");
    }
}

// FILTER
function filterAppointments(type) {
    currentFilter = type;
    viewAppointment();
}

// EXPORT
window.connectWallet = connectWallet;
window.deposit = deposit;
window.withdraw = withdraw;
window.book = book;
window.viewAppointment = viewAppointment;
window.editAppointment = editAppointment;
window.cancelByIndex = cancelByIndex;
window.closeAppointments = closeAppointments;
window.filterAppointments = filterAppointments;
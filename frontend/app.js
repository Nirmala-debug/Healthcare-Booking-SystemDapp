const contractAddress ="0x99dBE4AEa58E518C50a1c04aE9b48C9F6354612f";

let provider;
let signer;
let contract;
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

const femaleDoctors = [
    "Dr Nirmala Tamang",
    "Dr Pema",
    "Dr Pranika",
    "Dr Sita"
];

// ✅ TIME CATEGORY
function getTimeCategory(hour) {
    if (hour >= 5 && hour < 12) return "🌅 Morning";
    if (hour >= 12 && hour < 17) return "☀️ Afternoon";
    if (hour >= 17 && hour < 21) return "🌇 Evening";
    return "🌙 Night";
}

// STATUS
function setStatus(message) {
    document.getElementById("status").innerText = message;
}

// CLOSE
function closeAppointments() {
    document.getElementById("appointmentsContainer").innerHTML = "";
}

// CONNECT WALLET
async function connectWallet() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    const address = await signer.getAddress();

    role = document.getElementById("userRole").value;

    document.getElementById("walletAddress").innerText =
        "💖 Connected: " + address;

    contract = new ethers.Contract(contractAddress, [
        "function deposit() payable",
        "function withdraw()",
        "function bookAppointment(string,uint8,uint256)",
        "function getMyAppointments() view returns (tuple(address,string,uint8,uint256)[])",
        "function getAllAppointments() view returns (tuple(address,string,uint8,uint256)[])",
        "function cancelAppointment(uint)"
    ], signer);

    setStatus("🔗 Connected as " + role);
}

// DEPOSIT
async function deposit() {
    try {
        if (!contract) {
            setStatus("⚠️ Connect wallet first");
            return;
        }

        setStatus("⏳ Sending transaction...");

        const tx = await contract.deposit({
            value: ethers.utils.parseEther("1")
        });

        setStatus("⏳ Waiting...");
        await tx.wait();

        if (role === "doctor") {
            document.getElementById("bookBtn").style.display = "none";
            document.getElementById("doctor").style.display = "none";
            document.getElementById("purpose").style.display = "none";
            document.getElementById("appointmentTime").style.display = "none";

            setStatus("👨‍⚕️ Doctor mode + Deposit successful");
            viewAppointment();
        } else {
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

        const selectedDate = new Date(input);
        if (selectedDate <= new Date()) {
            setStatus("⚠️ Select future time");
            return;
        }

        const time = Math.floor(selectedDate.getTime() / 1000);

        setStatus("⏳ Booking...");
        const tx = await contract.bookAppointment(doctor, type, time);
        await tx.wait();

        setStatus("🎉 Appointment booked!");

        document.getElementById("doctor").value = "";
        document.getElementById("purpose").value = "";
        document.getElementById("appointmentTime").value = "";

        viewAppointment();

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

        let output = `
        <div style="text-align:right;">
            <button onclick="closeAppointments()">❌ Close</button>
        </div>`;

        data.forEach((a, i) => {
            const doctor = a[1];
            const time = new Date(Number(a[3]) * 1000);

            const readable = time.toLocaleString("en-US", {
                timeZone: "Asia/Kathmandu",
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
            <div style="
                margin:10px;
                padding:15px;
                border-radius:15px;
                border:1px solid #eee;
                background:#fff;
                box-shadow:0 4px 10px rgba(0,0,0,0.05);
            ">

                <b style="color:#e11d48;">📌 Appointment #${i + 1}</b><br><br>

                <div style="display:flex; gap:10px; align-items:center;">

                    <img src="${image}" style="width:45px; height:45px; border-radius:50%;">

                    <div>
                        <b>${doctor}</b><br>
                        ⭐ ${info.rating} &nbsp;&nbsp; 📍 ${info.distance}<br>

                        <span style="font-size:12px; color:#777;">
                            📅 ${readable} • ${category}
                        </span>
                    </div>
                    <div style="margin-top:10px; text-align:right;">
                        ${role === "patient" ? `
                        <button onclick="cancelByIndex(${i})"
                        style="
                            background:#ef4444;
                            color:white;
                            padding:6px 10px;
                            border:none;
                            border-radius:8px;
                            cursor:pointer;
                        ">
                            ❌ Cancel
                        </button>
                        ` : ""}
                    </div>
                    </div>
                    </div>
                </div>
            </div>`;
        }); // ✅ forEach close

        document.getElementById("appointmentsContainer").innerHTML = output;

    } catch (e) {
        console.error(e);
        setStatus("❌ Error loading appointments");
    }
}
// CANCEL
async function cancelByIndex(index) {
    try {
        const tx = await contract.cancelAppointment(index);
        await tx.wait();
        setStatus("❌ Cancelled");
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
window.cancelByIndex = cancelByIndex;
window.closeAppointments = closeAppointments;
window.filterAppointments = filterAppointments;
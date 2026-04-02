import hre from "hardhat";

async function main() {

  const { viem } = await hre.network.connect();

  const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

  const walletClient = await viem.getWalletClient();
  const [account] = await walletClient.getAddresses();

  const contract = await viem.getContractAt(
    "ReentrancyVulnerable",
    contractAddress
  );

  console.log("Depositing 1 ETH...");

  await walletClient.writeContract({
    address: contractAddress,
    abi: contract.abi,
    functionName: "deposit",
    account: account,
    value: 1000000000000000000n
  });

  console.log("Deposit successful");

  console.log("Withdrawing funds...");

  await walletClient.writeContract({
    address: contractAddress,
    abi: contract.abi,
    functionName: "withdraw",
    account: account
  });

  console.log("Withdraw successful");

}

main().catch(console.error);
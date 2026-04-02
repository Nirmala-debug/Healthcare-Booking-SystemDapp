import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    const privateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

    const wallet = new ethers.Wallet(privateKey, provider);

    const vulnerableAddress = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

    const artifact = await hre.artifacts.readArtifact("ReentrancyAttacker");

    const factory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        wallet
    );

    const contract = await factory.deploy(vulnerableAddress);

    await contract.waitForDeployment();

    console.log("Attacker deployed at:", await contract.getAddress());
}

main();
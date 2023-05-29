task("deploy", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    const MarketPlaceFactory = await hre.ethers.getContractFactory(
      "NFTMarketplace",
      deployer
    );
    const marketPlace = await MarketPlaceFactory.deploy();
    await marketPlace.deployed();

    console.log(
      `Marketplace with owner ${deployer.address} deployed to ${marketPlace.address}`
    );

    console.log(taskArgs.account); //comes from .addParam("account")
  });

task("create", "Creates a new NFT")
  .addParam("marketplace", "The contract's address")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    const MarketPlaceFactory = await hre.ethers.getContractFactory(
      "NFTMarketplace",
      deployer
    );

    const marketPlace = await MarketPlaceFactory.attach(taskArgs.marketplace);
    const tx = await marketPlace.createNFT("test");

    const receipt = await tx.wait();

    if (receipt.status === 0) {
      throw new Error("Transaction failed");
    }

    console.log(`NFT Created!`);

    console.log(taskArgs.account); //comes from .addParam("account")
  });

task("claim", "Claims profit")
  .addParam("marketplace", "The contract's address")
  .setAction(async (taskArgs, hre) => {
    const [deployer, firstUser] = await hre.ethers.getSigners();
    const MarketPlaceFactory = await hre.ethers.getContractFactory(
      "NFTMarketplace",
      deployer
    );

    const marketPlace = await MarketPlaceFactory.attach(taskArgs.marketplace);

    const tx = await marketPlace.createNFT("test");
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error("Transaction failed");
    }

    const tx2 = await marketPlace.listNFTForSale(taskArgs.marketplace, 0, 1000);
    const receipt2 = await tx2.wait();
    if (receipt2.status === 0) {
      throw new Error("Transaction2 failed");
    }

    const marketplaceFirstUser = marketPlace.connect(firstUser);
    const tx3 = await marketplaceFirstUser.purchaseNFT(
      taskArgs.marketplace,
      0,
      firstUser.address,
      { value: 1000 }
    );
    const receipt3 = await tx3.wait();
    if (receipt3.status === 0) {
      throw new Error("Transaction3 failed");
    }

    const tx4 = await marketPlace.claimProfit();
    const receipt4 = await tx4.wait();
    if (receipt4.status === 0) {
      throw new Error("Transaction4 failed");
    }
  });

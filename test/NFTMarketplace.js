const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployNFTMarketplaceFixture() {
    // Contracts are deployed using the first signer/account by default
    const [deployer, firstUser, secondUser] = await ethers.getSigners();

    const NFTMarketplace = await ethers.getContractFactory(
      "NFTMarketplace",
      deployer
    );
    const nftMarketplace = await NFTMarketplace.deploy();
    const nftMarketplaceFirstUser = await nftMarketplace.connect(firstUser);

    await nftMarketplaceFirstUser.createNFT("test");

    return {
      nftMarketplace,
      nftMarketplaceFirstUser,
      deployer,
      firstUser,
      secondUser,
    };
  }

  async function list() {
    const { nftMarketplaceFirstUser, secondUser } = await loadFixture(
      deployNFTMarketplaceFixture
    );
    const price = ethers.utils.parseEther("1");
    await nftMarketplaceFirstUser.approve(nftMarketplaceFirstUser.address, 0);
    await nftMarketplaceFirstUser.listNFTForSale(
      nftMarketplaceFirstUser.address,
      0,
      price
    );

    return { nftMarketplaceFirstUser, price, secondUser };
  }

  describe("Listing", function () {
    describe("Validations", function () {
      it("Should revert when price == 0", async function () {
        const { nftMarketplace } = await loadFixture(
          deployNFTMarketplaceFixture
        );

        await expect(
          nftMarketplace.listNFTForSale(nftMarketplace.address, 0, 0)
        ).to.be.revertedWith("Price must be greater than 0");
      });

      it("Should revert when NFT already listed", async function () {
        const { nftMarketplaceFirstUser } = await loadFixture(
          deployNFTMarketplaceFixture
        );

        await nftMarketplaceFirstUser.approve(
          nftMarketplaceFirstUser.address,
          0
        );

        const price = ethers.utils.parseEther("1");

        await nftMarketplaceFirstUser.listNFTForSale(
          nftMarketplaceFirstUser.address,
          0,
          price
        );

        await expect(
          nftMarketplaceFirstUser.listNFTForSale(
            nftMarketplaceFirstUser.address,
            0,
            price
          )
        ).to.be.revertedWith("NFT already listed");
      });
    });

    describe("Transfers", function () {
      it("Should succeed", async function () {
        const { nftMarketplaceFirstUser } = await loadFixture(
          deployNFTMarketplaceFixture
        );

        await nftMarketplaceFirstUser.approve(
          nftMarketplaceFirstUser.address,
          0
        );

        const price = ethers.utils.parseEther("1");

        await expect(
          nftMarketplaceFirstUser.listNFTForSale(
            nftMarketplaceFirstUser.address,
            0,
            price
          )
        )
          .to.emit(nftMarketplaceFirstUser, "NFTListed")
          .withArgs(nftMarketplaceFirstUser.address, 0, price);
      });
    });
  });

  describe("Purchase", function () {
    describe("Validations", function () {
      it("Should revert when NFT not listed", async function () {
        const { nftMarketplace, secondUser } = await loadFixture(
          deployNFTMarketplaceFixture
        );

        await expect(
          nftMarketplace.purchaseNFT(
            nftMarketplace.address,
            0,
            secondUser.address
          )
        ).to.be.revertedWith("NFT not listed");
      });

      it("Should revert when insufficient funds", async function () {
        const { nftMarketplaceFirstUser, secondUser } = await loadFixture(list);

        const wrongPrice = ethers.utils.parseEther("0.5");

        await expect(
          nftMarketplaceFirstUser.purchaseNFT(
            nftMarketplaceFirstUser.address,
            0,
            secondUser.address,
            { value: wrongPrice }
          )
        ).to.be.revertedWith("Insufficient funds");
      });
    });

    describe("Transfers", function () {
      it("Should succeed", async function () {
        const { nftMarketplaceFirstUser, price, secondUser } =
          await loadFixture(list);

        await nftMarketplaceFirstUser.purchaseNFT(
          nftMarketplaceFirstUser.address,
          0,
          secondUser.address,
          { value: price }
        );

        expect(
          (
            await nftMarketplaceFirstUser.nftSales(
              nftMarketplaceFirstUser.address,
              0
            )
          ).price
        ).to.equal(0);
        expect(await nftMarketplaceFirstUser.ownerOf(0)).to.equal(
          secondUser.address
        );
      });
    });
  });
});

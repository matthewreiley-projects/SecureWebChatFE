import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import "./Login.css"

export default function Login() {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://192.168.86.22:3000";

  async function generateOrGetKeyPair() {
    const privateKeyStored = localStorage.getItem("privateKey");
    const publicKeyStored = localStorage.getItem("publicKey");

    // If keys are already stored
    if (privateKeyStored && publicKeyStored) {
      try {
        const privateKeyJwk = JSON.parse(privateKeyStored);
        const publicKeyJwk = JSON.parse(publicKeyStored);

        // ✅ Sanity check: make sure it's really a public key
        if (publicKeyJwk.d) {
          throw new Error("Corrupted public key: contains private fields.");
        }

        // Try to import the private key to verify it's valid
        await window.crypto.subtle.importKey(
          "jwk",
          privateKeyJwk,
          { name: "RSA-OAEP", hash: "SHA-256" },
          true,
          ["decrypt"]
        );

        // Patch public key with correct metadata (in case it's missing)
        publicKeyJwk.alg = "RSA-OAEP-256";
        publicKeyJwk.use = "enc";
        publicKeyJwk.key_ops = ["encrypt"];
        publicKeyJwk.ext = true;

        localStorage.setItem("publicKey", JSON.stringify(publicKeyJwk));
        return publicKeyJwk;
      } catch (e) {
        console.warn("Stored keys are invalid. Regenerating.", e);
        localStorage.removeItem("privateKey");
        localStorage.removeItem("publicKey");
      }
    }

    // Generate new key pair
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
      );

      const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
      const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

      // ✅ Patch public key JWK
      publicKeyJwk.alg = "RSA-OAEP-256";
      publicKeyJwk.use = "enc";
      publicKeyJwk.key_ops = ["encrypt"];
      publicKeyJwk.ext = true;

      localStorage.setItem("privateKey", JSON.stringify(privateKeyJwk));
      localStorage.setItem("publicKey", JSON.stringify(publicKeyJwk));

      return publicKeyJwk;
    } catch (e) {
      console.error("Key generation failed", e);
      return null;
    }
  }

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        setError("MetaMask is not installed. Please install it to continue.");
        return;
      }

      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(account);

      // Fetch nonce
      const { data } = await axios.get(
        `${API_BASE_URL}/api/auth/nonce?address=${account}`
      );
      const nonce = data.nonce;

      // Sign nonce
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonce);

      // Get public encryption key
      const publicEncryptionKey = await generateOrGetKeyPair();
      if (!publicEncryptionKey) {
        setError("Failed to generate encryption keys. Please refresh and try again.");
        return;
      }

      // Final check to ensure no private key data is sent
      if (publicEncryptionKey.d) {
        setError("Invalid public key detected. Clearing keys.");
        localStorage.removeItem("privateKey");
        localStorage.removeItem("publicKey");
        return;
      }

      // Login request
      const answer = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { address: account, signature, publicKey: publicEncryptionKey },
        { withCredentials: true }
      );

      console.log(answer)

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="hero-left">
          <h1>
            <img 
              src="/snug.png" 
              alt="App Logo" 
              className="login-logo"
            />

          </h1>
          <p>Private, wallet-based messaging with end-to-end encryption. No passwords. No nonsense.</p>
          <ul>
            <li>✅ Web3-native authentication</li>
            <li>🔒 Local key encryption</li>
            <li>💬 Decentralized room-based chat</li>
          </ul>
        </div>

        <div className="hero-right login-card">
          <h2>Connect to Continue</h2>
          {address && <p className="connected">Wallet: {address}</p>}
          {error && <p className="error">{error}</p>}
          <button onClick={connectWallet} disabled={loading}>
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      </div>
    </div>
  );

}


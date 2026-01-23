# 🤗 Hugging Face Deployment Guide (100% Free - No Card)

Hugging Face Spaces is the best option because it's completely free, requires **NO credit card**, and never "sleeps."

### 1. Create a Hugging Face Account
- Go to [huggingface.co](https://huggingface.co/) and sign up.

### 2. Create a New Space
- Click your profile icon -> **"New Space"**.
- **Space Name**: `freelancer-api`
- **SDK**: Select **"Docker"**.
- **Template**: Choose **"Blank"**.
- **Public/Private**: Select **"Public"** (required for the API to work).
- Click **"Create Space"**.

### 3. Connect Your GitHub
- Once the Space is created, go to the **"Settings"** tab.
- Scroll down to **"Repository mirroring"**.
- Follow the instructions to mirror your GitHub repo `dashboard-project`.
- **OR**: If you prefer, just click **"Files"** -> **"Add file"** -> **"Upload files"** and upload the contents of your `server` folder.

### 4. Important Setup
- In the **"Settings"** tab, scroll to **"Variables and secrets"**.
- Click **"New variable"** for these:
  - `PORT`: `7860` (Hugging Face requires this exact port).
  - `JWT_SECRET`: `your_secret_here`
  - `SYNC_SECRET`: `helium_sync_default_secret_9988`
- Hugging Face will automatically build and start your server.

### 5. Get the URL
- Once it says **"Running"**, click the **"Embed this Space"** button (three dots menu -> Embed).
- Look for the **"Direct URL"** (it looks like `https://username-space-name.hf.space`).
- **Paste it here** for me!

---
> [!TIP]
> Hugging Face is incredibly stable. Once this is set up, your 5-minute sync will run forever without any interaction!

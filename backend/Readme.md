### Setup

**Add .ENV**
```bash
PORT=8080
DB_URI=postgresql://postgres:admin@localhost:5433/kudiswap
JWT_SECRET=your_jwt_secret
NODE_ENV=development

```

**Install Node module**
   ```bash
   npm install
   ```

**Install TypeScript globally (recommended for development):**
   ```bash
   npm install -g typescript
   ```
**Rebuilding:**
   ```bash
   rm -rf dist/ && npm run build
   ```

To serve your localhost online and make it accessible over the internet, you can use one of the following methods:

---

### **1. Using ngrok to serve localhost online (development)**
**Ngrok** creates a secure tunnel from the internet to your localhost.
1. **Download ngrok** from [https://ngrok.com](https://ngrok.com) and sign up.

2. **Start ngrok** (default HTTP port 80, or specify your app's port, e.g., 3000, 5000, 8080):
   ```bash
   ngrok http 3000
   ```
3. You'll get a public URL like `https://abc123.ngrok.io` that forwards to `localhost:3000`.

[https://dashboard.ngrok.com/get-started/setup/linux]


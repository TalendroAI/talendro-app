# 📧 Instructions for Sharing Talendro Resume Parser Demo

## What to Email

Send these files to the recipient:

1. **`SHAREABLE_DEMO_PACKAGE.html`** - The demo page (single HTML file)
2. **This instruction file** - So they know how to use it

## Option 1: If You Have a Deployed Server (Recommended)

If your Talendro server is deployed and accessible via URL (e.g., `https://api.talendro.com`):

### What to Tell Them:

```
Subject: Talendro Resume Parser Demo

Hi [Name],

I've attached a demo of our resume parsing system. Here's how to use it:

1. Open the attached HTML file in any web browser (Chrome, Firefox, Safari, etc.)
2. In the "Server Configuration" section at the top, enter this URL:
   [YOUR_SERVER_URL]
   Example: https://api.talendro.com
3. Click "Connect" - you should see a green status indicator
4. Upload a resume file (PDF, DOCX, DOC, RTF, or TXT)
5. Click "Parse Resume"
6. Review the extracted data in the tabs below

The demo shows:
- Personal information extracted from the resume
- Work experience with dates and descriptions
- Education history
- Skills list
- How the data would populate our registration forms

Let me know if you have any questions!

Best,
[Your Name]
```

---

## Option 2: If Server is Only on Your Network

If your server is only accessible on your local network, you have a few options:

### A. Use a Tunnel Service (Easiest)

Use a service like **ngrok** or **localtunnel** to create a public URL:

#### Using ngrok:
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5001
```

This gives you a URL like `https://abc123.ngrok.io` that you can share.

#### Using localtunnel:
```bash
npm install -g localtunnel
lt --port 5001
```

### B. Deploy to a Cloud Service

Deploy your server to:
- **Heroku** (free tier available)
- **Railway** (free tier)
- **Render** (free tier)
- **AWS/Google Cloud/Azure** (if you have accounts)

Then share the deployed URL.

### C. Use VPN/Remote Access

If you have VPN access, they can connect to your network and use:
```
http://your-internal-ip:5001
```

---

## Option 3: Self-Contained Demo (No Server Needed)

If you want them to test without a server, you'd need to create a mock version. However, the real parsing requires the server.

**Alternative**: Create a video/screen recording showing the demo in action.

---

## Step-by-Step Instructions for Recipient

### Quick Start:

1. **Open the HTML file**
   - Double-click `SHAREABLE_DEMO_PACKAGE.html`
   - Or right-click → Open With → Your Browser

2. **Configure the server**
   - You'll see a yellow configuration box at the top
   - Enter the server URL provided by the sender
   - Click "Connect"
   - Wait for green status indicator (✅ Connected)

3. **Upload a resume**
   - Click "📄 Choose File" or drag & drop a resume
   - Supported formats: PDF, DOCX, DOC, RTF, TXT
   - Maximum file size: 10MB

4. **Parse the resume**
   - Click "Parse Resume" button
   - Wait 10-30 seconds for processing
   - Results will appear below

5. **Review results**
   - **Summary Tab**: See extracted information
   - **Form Prefill Tab**: See how data maps to forms
   - **Profile Draft Tab**: See complete profile structure
   - **Raw JSON Tab**: See full API response

---

## Troubleshooting for Recipient

### "Cannot connect to server"
- Verify the server URL is correct
- Check that the server is running
- Try the test URL: `[SERVER_URL]/api/resume/parser-info`
- If using HTTPS, ensure SSL certificate is valid

### "CORS error" or "Network error"
- The server must allow requests from the browser
- Contact the server administrator to enable CORS
- Or try accessing from the same domain as the server

### "Parsing failed"
- Check that the file is a valid resume format
- Ensure file size is under 10MB
- Try a different resume file
- Check server logs for detailed error

### File won't upload
- Check file size (must be < 10MB)
- Verify file format is supported
- Try a different browser

---

## What They'll See

The demo displays:

1. **Personal Information**
   - Name, email, phone, location

2. **Work Experience**
   - Company names, job titles
   - Employment dates
   - Job descriptions and achievements
   - Locations

3. **Education**
   - Institutions
   - Degrees and majors
   - Graduation dates
   - GPAs

4. **Skills**
   - Technical skills
   - Professional certifications
   - Software proficiency

5. **Form Prefill Data**
   - How data maps to Step 1 (Account Creation)
   - How data maps to Step 3 (Personal Information)
   - Complete profile structure

---

## Security Notes

- The resume file is sent to the server for processing
- No data is stored permanently (unless server is configured to do so)
- All processing happens server-side
- The HTML file itself contains no sensitive data

---

## Support

If the recipient has issues:
1. Check the browser console (F12) for errors
2. Verify server URL is correct
3. Test server connectivity: `[SERVER_URL]/api/resume/parser-info`
4. Contact the sender for server status

---

## Example Email Template

```
Subject: Talendro Resume Parser - Demo Package

Hi [Name],

I'm excited to share our resume parsing technology with you!

Attached is a demo that shows how we automatically extract information 
from resumes and populate registration forms.

QUICK START:
1. Open SHAREABLE_DEMO_PACKAGE.html in your browser
2. Enter server URL: [YOUR_URL_HERE]
3. Upload a resume (PDF or DOCX)
4. See the magic happen! ✨

The demo shows:
✅ Personal information extraction
✅ Work history parsing
✅ Education details
✅ Skills identification
✅ Automatic form population

Server URL: [YOUR_SERVER_URL]
(If you see a green status indicator, you're connected!)

Let me know what you think!

Best regards,
[Your Name]
```

---

**Ready to share?** Just attach the HTML file and send this instruction file along with it!


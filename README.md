# LockIn Alpha: AI Video Lectures

LockIn Alpha helps you automatically create engaging video lectures from your study materials. Upload your documents or write a script, and LockIn transforms them into professional video presentations.

## Features

- **Document Upload**: Upload study materials in PDF, DOCX, or TXT formats
- **AI Script Generation**: Automatically convert content into well-structured lecture scripts
- **Video Creation**: Generate video lectures with animations and voiceover
- **Easy Sharing**: Download or share your finished videos

## Setup Guide for New Users

### Step 1: Requirements

- Computer with a modern web browser (Chrome recommended)
- Internet connection
- Basic accounts for free services:
  - [Supabase](https://supabase.com/) - For storing your files
  - [AWS](https://aws.amazon.com/) - For text-to-speech

### Step 2: Create Required Accounts

1. **Create a Supabase Account**:
   - Go to [Supabase](https://supabase.com/) and sign up
   - Create a new project (free tier is sufficient)
   - On the project dashboard, find and copy your:
     - **Project URL** (under Settings → API)
     - **Project API key** (the "anon, public" key under Settings → API)

2. **Create an AWS Account**:
   - Go to [AWS](https://aws.amazon.com/) and sign up
   - Access the IAM console and create a new user
   - Give the user "AmazonPollyFullAccess" permissions
   - Generate an access key and secret key for this user
   - Make sure to save both keys securely

### Step 3: Set Up Supabase Storage

1. In your Supabase dashboard, go to "Storage"
2. Create three buckets:
   - `documents` - For storing uploaded study materials
   - `videos` - For storing generated video files
   - `audios` - For storing audio files
3. For each bucket:
   - Select "Public" bucket type
   - Set the privacy setting to "Public"
   - Go to "Policies" tab and click "Add New Policy"
   - Set the policy template to "Allow full access to authenticated users"
   - Name it something like "AllowPublicAccess"
   - Set the policy definition to `true` to allow all operations

### Step 4: Clone and Set Up the Application

#### Option A: Run Locally (for developers)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lockinalpha.git
   cd lockinalpha
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

#### Option B: Deploy to Vercel (easiest for non-developers)

1. Fork the repository on GitHub
2. Sign up for [Vercel](https://vercel.com/)
3. Click "New Project" in Vercel
4. Import your GitHub repository
5. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `AWS_ACCESS_KEY_ID`: Your AWS access key ID
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
   - `AWS_REGION`: us-east-1 (or your preferred region)
6. Click "Deploy"

### Step 5: Using the Application

1. **Upload Documents**:
   - Go to the "Upload Files" page
   - Select and upload your study materials (PDF, DOCX, or TXT)

2. **Create Video**:
   - Go to the "Create Video" page
   - Write or import a script
   - Choose voice and style options
   - Click "Generate Video"

3. **View & Share Videos**:
   - Once processing is complete, you can view your videos
   - Download the video files or share the link

## Troubleshooting

- **Upload Failures**: Check your Supabase bucket policies
- **Video Generation Issues**: Ensure AWS credentials are correct
- **Blank Page**: Clear browser cache and refresh
- **Other Issues**: Try restarting the application

## Limitations

- Free tier storage limits apply for Supabase
- Larger videos may take longer to process
- AWS free tier has monthly usage limits

## License

[MIT](LICENSE)

---

*For developers: See the deployment directories for advanced configuration options and hosting alternatives.*

const express = require('express');
const app = express();
app.use(express.json());

// Store call start times (only for local testing)
const callStartTimes = new Map();

app.post('/api/check-duration', async (req, res) => {
  try {
    const { message, call } = req.body;
    const MAX_DURATION_SECONDS = 15;
    
    let startTime;
    
    // Method 1: If Vapi sends startedAt (production)
    if (call.startedAt || call.createdAt) {
      startTime = new Date(call.startedAt || call.createdAt).getTime();
    } 
    // Method 2: Store locally for testing (without timestamp)
    else {
      const callId = call.id;
      
      if (!callStartTimes.has(callId)) {
        callStartTimes.set(callId, Date.now());
        console.log(`✅ New call started: ${callId}`);
      }
      
      startTime = callStartTimes.get(callId);
    }
    
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - startTime) / 1000;
    
    console.log(`⏱️  Call ${call.id}: ${elapsedSeconds.toFixed(1)}s elapsed`);
    
    if (elapsedSeconds >= MAX_DURATION_SECONDS) {
      console.log(`❌ Call ${call.id}: Ending (${elapsedSeconds.toFixed(1)}s)`);
      
      // Clean up
      callStartTimes.delete(call.id);
      
      return res.json({
        results: [{
          toolCallId: message.toolCallId,
          result: JSON.stringify({
            shouldEndCall: true,
            elapsed: Math.round(elapsedSeconds * 100) / 100
          })
        }]
      });
    } else {
      console.log(`✅ Call ${call.id}: Continuing (${(MAX_DURATION_SECONDS - elapsedSeconds).toFixed(1)}s remaining)`);
      
      return res.json({
        results: [{
          toolCallId: message.toolCallId,
          result: JSON.stringify({
            shouldEndCall: false,
            remaining: Math.round((MAX_DURATION_SECONDS - elapsedSeconds) * 100) / 100
          })
        }]
      });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/check-duration`);
});
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const VoiceTestComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  const testElevenLabsFunction = async () => {
    setIsLoading(true);
    setTestResult('Testing...');
    
    try {
      console.log('🧪 Testing ElevenLabs function...');
      
      const response = await supabase.functions.invoke('cuizly-voice-elevenlabs', {
        body: { text: "Bonjour, ceci est un test" }
      });
      
      console.log('🧪 ElevenLabs response:', response);
      
      if (response.error) {
        setTestResult(`❌ Error: ${response.error.message}`);
        console.error('ElevenLabs error:', response.error);
      } else if (response.data?.audioContent) {
        setTestResult(`✅ SUCCESS! Audio generated (${response.data.audioContent.length} chars)`);
        
        // Try to play the audio
        const audioUrl = `data:audio/mp3;base64,${response.data.audioContent}`;
        const audio = new Audio(audioUrl);
        audio.play().catch(e => {
          console.error('Audio play error:', e);
          setTestResult(prev => prev + ` | ❌ Audio play failed: ${e.message}`);
        });
      } else {
        setTestResult(`❌ No audio content received`);
      }
    } catch (error) {
      console.error('🧪 Test error:', error);
      setTestResult(`❌ Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFullVoiceFlow = async () => {
    setIsLoading(true);
    setTestResult('Testing full voice flow...');
    
    try {
      // Test 1: Voice-to-text (simulate with text)
      console.log('🧪 Step 1: Testing voice-to-text simulation...');
      const transcription = "Bonjour Cuizly, comment ça va ?";
      
      // Test 2: ChatGPT processing
      console.log('🧪 Step 2: Testing ChatGPT processing...');
      const chatResponse = await supabase.functions.invoke('cuizly-voice-chat', {
        body: { 
          message: transcription,
          userId: 'test-user-id',
          conversationHistory: []
        }
      });
      
      if (chatResponse.error) {
        setTestResult(`❌ ChatGPT Error: ${chatResponse.error.message}`);
        return;
      }
      
      const aiResponse = chatResponse.data?.response;
      if (!aiResponse) {
        setTestResult(`❌ No AI response received`);
        return;
      }
      
      console.log('🧪 ChatGPT response:', aiResponse);
      
      // Test 3: Text-to-speech
      console.log('🧪 Step 3: Testing text-to-speech...');
      const ttsResponse = await supabase.functions.invoke('cuizly-voice-elevenlabs', {
        body: { text: aiResponse }
      });
      
      if (ttsResponse.error) {
        setTestResult(`❌ TTS Error: ${ttsResponse.error.message}`);
        return;
      }
      
      if (ttsResponse.data?.audioContent) {
        setTestResult(`✅ FULL FLOW SUCCESS! All 3 steps worked`);
        
        // Play the final audio
        const audioUrl = `data:audio/mp3;base64,${ttsResponse.data.audioContent}`;
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        setTestResult(`❌ TTS: No audio content received`);
      }
      
    } catch (error) {
      console.error('🧪 Full flow test error:', error);
      setTestResult(`❌ Full flow failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg m-4 bg-background">
      <h3 className="text-lg font-semibold mb-4">🧪 Voice System Debug</h3>
      
      <div className="space-y-2 mb-4">
        <Button 
          onClick={testElevenLabsFunction} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Testing...' : 'Test ElevenLabs Only'}
        </Button>
        
        <Button 
          onClick={testFullVoiceFlow} 
          disabled={isLoading}
          variant="default"
        >
          {isLoading ? 'Testing...' : 'Test Full Voice Flow'}
        </Button>
      </div>
      
      {testResult && (
        <div className="p-3 border rounded bg-muted">
          <code className="text-sm">{testResult}</code>
        </div>
      )}
    </div>
  );
};

export default VoiceTestComponent;
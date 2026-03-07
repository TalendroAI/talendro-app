import { useCallback, useEffect, useState } from 'react';

export function useAudioDevices() {
  const [inputs, setInputs] = useState([]);
  const [selectedInputId, setSelectedInputId] = useState('');
  const [isEnumerating, setIsEnumerating] = useState(false);

  const enumerate = useCallback(async () => {
    setIsEnumerating(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || (d.deviceId === 'default' ? 'Default microphone' : 'Microphone'),
        }));
      setInputs(audioInputs);
      if (audioInputs.length > 0) {
        const stillExists = audioInputs.some((d) => d.deviceId === selectedInputId);
        if (!stillExists) {
          const preferred = audioInputs.find((d) => d.deviceId !== 'default')?.deviceId;
          setSelectedInputId(preferred ?? audioInputs[0].deviceId);
        }
      }
    } finally {
      setIsEnumerating(false);
    }
  }, [selectedInputId]);

  const ensurePermissionThenEnumerate = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    await enumerate();
  }, [enumerate]);

  useEffect(() => {
    enumerate();
  }, [enumerate]);

  return {
    inputs,
    selectedInputId,
    setSelectedInputId,
    enumerate,
    ensurePermissionThenEnumerate,
    isEnumerating,
  };
}

export default useAudioDevices;

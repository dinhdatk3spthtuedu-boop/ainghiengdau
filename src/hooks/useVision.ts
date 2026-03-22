import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FaceLandmarker,
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';

export type HeadTilt = 'left' | 'right' | 'center';

export function useVision(trigger?: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tilts, setTilts] = useState<HeadTilt[]>(['center', 'center']);
  const [fingersRaised, setFingersRaised] = useState<number[]>([0, 0]);
  const [isReady, setIsReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    const initModels = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );

        if (!active) return;

        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 2,
        });

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });

        if (active) {
          setIsReady(true);
        }
      } catch (error: any) {
        console.error('Error initializing MediaPipe models:', error);
        if (active) {
          setInitError(error.message || 'Lỗi khởi tạo AI. Vui lòng tải lại trang.');
        }
      }
    };

    initModels();

    return () => {
      active = false;
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraError(null);
    } catch (err: any) {
      console.error('Error accessing webcam:', err);
      setCameraError(err.message || 'Không thể truy cập Camera. Vui lòng kiểm tra quyền truy cập.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    cancelAnimationFrame(requestRef.current);
  }, []);

  const detect = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !faceLandmarkerRef.current || !handLandmarkerRef.current) {
      requestRef.current = requestAnimationFrame(detect);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState >= 2 && ctx) {
      const startTimeMs = performance.now();

      // Ensure canvas matches video dimensions
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const drawingUtils = new DrawingUtils(ctx);

      // Detect Face
      const faceResults = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
      const newTilts: HeadTilt[] = ['center', 'center'];

      if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
        // Sort faces by x coordinate (descending because video is mirrored in UI)
        // Person on the left of mirrored screen has larger X in raw video
        const sortedFaces = [...faceResults.faceLandmarks].sort((a, b) => b[0].x - a[0].x);

        sortedFaces.forEach((landmarks, index) => {
          if (index > 1) return; // Only handle up to 2 faces

          // Draw face mesh
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
            color: index === 0 ? '#FF000070' : '#0000FF70', // Red for P1, Blue for P2
            lineWidth: 1,
          });

          // Calculate head tilt
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const yDiff = leftEye.y - rightEye.y;

          if (yDiff > 0.03) {
            newTilts[index] = 'left';
          } else if (yDiff < -0.03) {
            newTilts[index] = 'right';
          } else {
            newTilts[index] = 'center';
          }
        });
      }
      
      setTilts(prev => {
        if (prev[0] === newTilts[0] && prev[1] === newTilts[1]) return prev;
        return newTilts;
      });

      // Detect Hands
      const handResults = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
      const newFingers: number[] = [0, 0];

      if (handResults.landmarks && handResults.landmarks.length > 0) {
        // Sort hands by x coordinate (descending because video is mirrored in UI)
        const sortedHands = [...handResults.landmarks].sort((a, b) => b[0].x - a[0].x);

        sortedHands.forEach((landmarks, index) => {
          if (index > 1) return;

          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: index === 0 ? '#FF0000' : '#0000FF',
            lineWidth: 3,
          });
          drawingUtils.drawLandmarks(landmarks, { color: '#FFFFFF', lineWidth: 1 });

          let count = 0;
          if (landmarks[4].x < landmarks[3].x) count++;
          if (landmarks[8].y < landmarks[6].y) count++;
          if (landmarks[12].y < landmarks[10].y) count++;
          if (landmarks[16].y < landmarks[14].y) count++;
          if (landmarks[20].y < landmarks[18].y) count++;

          newFingers[index] = count;
        });
      }
      
      setFingersRaised(prev => {
        if (prev[0] === newFingers[0] && prev[1] === newFingers[1]) return prev;
        return newFingers;
      });
    }

    requestRef.current = requestAnimationFrame(detect);
  }, []);

  useEffect(() => {
    if (isReady && videoRef.current) {
      startCamera().then(() => {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(detect);
      });
    }
    return () => {
      stopCamera();
    };
  }, [isReady, startCamera, stopCamera, detect, trigger]);

  return { videoRef, canvasRef, tilts, fingersRaised, isReady, cameraError, initError };
}

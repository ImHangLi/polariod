import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import type { AspectRatio } from '../types/camera';

export function useCapture() {
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const capturingRef = useRef(false);
  const hasMediaPermission = useRef(false);

  // Request media library permission once on mount
  useEffect(() => {
    MediaLibrary.requestPermissionsAsync().then(({ status }) => {
      hasMediaPermission.current = status === 'granted';
    });
  }, []);

  const capture = useCallback(async (aspectRatio: AspectRatio) => {
    if (!cameraRef.current || capturingRef.current) return;

    capturingRef.current = true;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      if (!photo) return;

      const photoAspect = photo.width / photo.height;
      const targetAspect = aspectRatio.width / aspectRatio.height;

      let cropX = 0;
      let cropY = 0;
      let cropWidth = photo.width;
      let cropHeight = photo.height;

      if (photoAspect > targetAspect) {
        cropWidth = Math.round(photo.height * targetAspect);
        cropX = Math.round((photo.width - cropWidth) / 2);
      } else {
        cropHeight = Math.round(photo.width / targetAspect);
        cropY = Math.round((photo.height - cropHeight) / 2);
      }

      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: { originX: cropX, originY: cropY, width: cropWidth, height: cropHeight } }],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
      );

      if (!hasMediaPermission.current) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        hasMediaPermission.current = status === 'granted';
      }
      if (hasMediaPermission.current) {
        await MediaLibrary.saveToLibraryAsync(cropped.uri);
      }
    } finally {
      capturingRef.current = false;
      setCapturing(false);
    }
  }, []);

  return { cameraRef, capture, capturing };
}

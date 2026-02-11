import { useState, useEffect } from "react";

interface UseAssetPreloaderReturn {
  isLoading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Hook to preload all card assets and other images
 * Returns loading state, progress percentage, and any errors
 */
export const useAssetPreloader = (): UseAssetPreloaderReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const preloadAssets = async () => {
      try {
        // Get all card images using Vite's import.meta.glob
        const imageModules = import.meta.glob<{ default: string }>(
          "../assets/cards/*.{jpg,jpeg,png,webp}",
          { eager: false }, // Lazy load to track progress
        );

        // Also preload other critical assets
        const otherAssets = import.meta.glob<{ default: string }>(
          [
            "../assets/card-back.png",
            "../assets/final-card-design.png",
            "../assets/layout/*.{jpg,jpeg,png,webp,svg}",
          ],
          { eager: false },
        );

        const allAssets = { ...imageModules, ...otherAssets };
        const assetPaths = Object.keys(allAssets);
        const totalAssets = assetPaths.length;

        if (totalAssets === 0) {
          setIsLoading(false);
          setProgress(100);
          return;
        }

        let loadedCount = 0;

        // Load each asset
        const loadPromises = assetPaths.map(async (path) => {
          try {
            const module = await allAssets[path]();
            const imageUrl = module.default;

            // Preload the image by creating an Image object
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                loadedCount++;
                setProgress(Math.round((loadedCount / totalAssets) * 100));
                resolve();
              };
              img.onerror = () => {
                loadedCount++;
                setProgress(Math.round((loadedCount / totalAssets) * 100));
                // Don't reject - we want to continue loading other assets
                resolve();
              };
              img.src = imageUrl;
            });
          } catch (err) {
            loadedCount++;
            setProgress(Math.round((loadedCount / totalAssets) * 100));
            console.warn(`Failed to load asset: ${path}`, err);
          }
        });

        await Promise.all(loadPromises);

        // Add a small delay to ensure smooth transition
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsLoading(false);
      } catch (err) {
        console.error("Error preloading assets:", err);
        setError("Failed to load some assets");
        setIsLoading(false);
      }
    };

    preloadAssets();
  }, []);

  return { isLoading, progress, error };
};

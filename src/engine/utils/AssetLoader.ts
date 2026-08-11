/**
 * Asset Loader Manager
 * Centralized asset loading with caching and error handling
 */

import type { AssetManifest } from '../types';

interface LoadedAsset {
  data: any;
  url: string;
  loadedAt: number;
}

export class AssetLoader {
  private cache: Map<string, LoadedAsset> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private manifest: AssetManifest | null = null;
  
  constructor(manifest?: AssetManifest) {
    if (manifest) {
      this.manifest = manifest;
    }
  }
  
  /**
   * Load a texture with caching
   */
  async loadTexture(url: string): Promise<THREE.Texture> {
    const cached = this.cache.get(url);
    if (cached) {
      return Promise.resolve(cached.data);
    }
    
    const existing = this.loadingPromises.get(url);
    if (existing) {
      return existing;
    }
    
    const promise = new Promise<THREE.Texture>(async (resolve, reject) => {
      try {
        const THREE = await import('three');
        const loader = new THREE.TextureLoader();
        const texture = await new Promise<THREE.Texture>((res, rej) => {
          loader.load(url, res, undefined, rej);
        });
        
        texture.colorSpace = THREE.SRGBColorSpace;
        
        this.cache.set(url, {
          data: texture,
          url,
          loadedAt: Date.now(),
        });
        
        resolve(texture);
      } catch (error) {
        console.error(`Failed to load texture: ${url}`, error);
        reject(error);
      } finally {
        this.loadingPromises.delete(url);
      }
    });
    
    this.loadingPromises.set(url, promise);
    return promise;
  }
  
  /**
   * Load a GLTF model with caching
   */
  async loadModel(url: string): Promise<any> {
    const cached = this.cache.get(url);
    if (cached) {
      return Promise.resolve(cached.data);
    }
    
    const existing = this.loadingPromises.get(url);
    if (existing) {
      return existing;
    }
    
    const promise = new Promise<any>(async (resolve, reject) => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((res, rej) => {
          loader.load(url, res, undefined, rej);
        });
        
        this.cache.set(url, {
          data: gltf,
          url,
          loadedAt: Date.now(),
        });
        
        resolve(gltf);
      } catch (error) {
        console.error(`Failed to load model: ${url}`, error);
        reject(error);
      } finally {
        this.loadingPromises.delete(url);
      }
    });
    
    this.loadingPromises.set(url, promise);
    return promise;
  }
  
  /**
   * Load an audio file with caching
   */
  async loadAudio(url: string): Promise<AudioBuffer> {
    const cached = this.cache.get(url);
    if (cached) {
      return Promise.resolve(cached.data);
    }
    
    const existing = this.loadingPromises.get(url);
    if (existing) {
      return existing;
    }
    
    const promise = new Promise<AudioBuffer>(async (resolve, reject) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        this.cache.set(url, {
          data: audioBuffer,
          url,
          loadedAt: Date.now(),
        });
        
        resolve(audioBuffer);
      } catch (error) {
        console.error(`Failed to load audio: ${url}`, error);
        reject(error);
      } finally {
        this.loadingPromises.delete(url);
      }
    });
    
    this.loadingPromises.set(url, promise);
    return promise;
  }
  
  /**
   * Preload multiple assets from manifest
   */
  async preloadAll(): Promise<void> {
    if (!this.manifest) {
      console.warn('No asset manifest provided');
      return;
    }
    
    const promises: Promise<any>[] = [];
    
    // Load all textures
    for (const [key, url] of Object.entries(this.manifest.textures || {})) {
      promises.push(this.loadTexture(url));
    }
    
    // Load all models
    for (const [key, url] of Object.entries(this.manifest.models || {})) {
      promises.push(this.loadModel(url));
    }
    
    // Load all sounds
    for (const [key, url] of Object.entries(this.manifest.sounds || {})) {
      promises.push(this.loadAudio(url));
    }
    
    await Promise.all(promises);
    console.log('All assets preloaded successfully');
  }
  
  /**
   * Clear cache to free memory
   */
  clearCache(): void {
    this.cache.forEach((asset) => {
      if (asset.data?.dispose) {
        asset.data.dispose();
      }
    });
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { count: number; size: number } {
    return {
      count: this.cache.size,
      size: Array.from(this.cache.values()).reduce((acc, asset) => {
        // Rough estimate of memory usage
        if (asset.data?.image) {
          return acc + (asset.data.image.width * asset.data.image.height * 4);
        }
        return acc;
      }, 0),
    };
  }
}

// Singleton instance
export const assetLoader = new AssetLoader();

export interface NetworkSpeedResult {
  download: number;
  upload: number;
  ping: number;
  ip?: string;
  isp?: string;
  connectionType?: string;
  timestamp: string;
}

export interface PingResult {
  success: boolean;
  ping: number;
  timestamp: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  downloadSpeed: number;
  downloadTime: number;
  downloadSize: number;
  timestamp: string;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  uploadSpeed: number;
  uploadTime: number;
  uploadSize: number;
  timestamp: string;
  error?: string;
}

export interface IpInfoResult {
  success: boolean;
  ip: string;
  isp: string;
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  timestamp: string;
  error?: string;
}

export class NetworkSpeedService {
  static async testPing(): Promise<PingResult> {
    try {
      const response = await fetch('/api/network-speed/ping');
      return await response.json();
    } catch (error) {
      return {
        success: false,
        ping: 0,
        timestamp: new Date().toISOString(),
        error: 'Không thể đo ping'
      };
    }
  }

  static async testDownload(): Promise<DownloadResult> {
    try {
      const response = await fetch('/api/network-speed/download');
      return await response.json();
    } catch (error) {
      return {
        success: false,
        downloadSpeed: 0,
        downloadTime: 0,
        downloadSize: 0,
        timestamp: new Date().toISOString(),
        error: 'Không thể đo tốc độ download'
      };
    }
  }

  static async testUpload(): Promise<UploadResult> {
    try {
      const response = await fetch('/api/network-speed/upload', {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        uploadSpeed: 0,
        uploadTime: 0,
        uploadSize: 0,
        timestamp: new Date().toISOString(),
        error: 'Không thể đo tốc độ upload'
      };
    }
  }

  static async getIpInfo(): Promise<IpInfoResult> {
    try {
      const response = await fetch('/api/network-speed/ip-info');
      return await response.json();
    } catch (error) {
      return {
        success: false,
        ip: '',
        isp: '',
        timestamp: new Date().toISOString(),
        error: 'Không thể lấy thông tin IP'
      };
    }
  }

  static async testConnection(): Promise<any> {
    try {
      const response = await fetch('/api/network-speed/test');
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Không thể kết nối đến API'
      };
    }
  }

  static async runFullTest(): Promise<NetworkSpeedResult> {
    try {
      const response = await fetch('/api/network-speed/full-test');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Lỗi kiểm tra mạng');
      }

      return {
        download: data.downloadSpeed || 0,
        upload: data.uploadSpeed || 0,
        ping: data.ping || 0,
        ip: data.ip || '',
        isp: data.isp || '',
        connectionType: this.getConnectionType(),
        timestamp: new Date().toLocaleString(),
      };
    } catch (error) {
      throw new Error('Không thể hoàn thành kiểm tra mạng');
    }
  }

  private static getConnectionType(): string {
    // @ts-ignore
    if ((navigator as any).connection && (navigator as any).connection.effectiveType) {
      // @ts-ignore
      return navigator.connection.effectiveType || '';
    }
    return '';
  }
} 
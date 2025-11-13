import axios, { AxiosRequestConfig } from 'axios'
import fs from 'fs'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { logMessage } from '../utils/logger'

export class ProxyManager {
	private proxyList: string[] = []
	private axiosConfig: AxiosRequestConfig = {}

	public getProxyAgent(
		proxyUrl: string,
		index: number,
		total: number
	): HttpsProxyAgent<any> | SocksProxyAgent | undefined {
		try {
			if (!proxyUrl) {
				throw new Error('Proxy URL is empty')
			}

			const isSocks = proxyUrl.toLowerCase().startsWith('socks')
			if (isSocks) {
				return new SocksProxyAgent(proxyUrl)
			}
			return new HttpsProxyAgent(proxyUrl.startsWith('http') ? proxyUrl : `http://${proxyUrl}`)
		} catch (error) {
			if (error instanceof Error) {
				logMessage(index, total, `Error creating proxy agent: ${error.message}`, 'error')
			} else {
				logMessage(index, total, `Error creating proxy agent`, 'error')
			}
			return undefined
		}
	}

	public loadProxies(): boolean {
		try {
			const proxyFile = fs.readFileSync('proxy.txt', 'utf8')
			this.proxyList = proxyFile
				.split('\n')
				.filter(line => line.trim())
				.map(proxy => {
					proxy = proxy.trim()
					if (!proxy.includes('://')) {
						return `http://${proxy}`
					}
					return proxy
				})

			if (this.proxyList.length === 0) {
				throw new Error('No proxies found in proxy.txt')
			}
			logMessage(null, null, `Loaded ${this.proxyList.length} proxies from proxy.txt`, 'success')
			return true
		} catch (error) {
			if (error instanceof Error) {
				logMessage(null, null, `Error loading proxies: ${error.message}`, 'error')
			} else {
				logMessage(null, null, `Error loading proxies`, 'error')
			}
			return false
		}
	}

	public async checkIP(index: number, total: number): Promise<boolean> {
		try {
			const response = await axios.get('https://api.ipify.org?format=json', this.axiosConfig)
			const ip = response.data.ip
			logMessage(index, total, `IP Using: ${ip}`, 'success')
			return true
		} catch (error) {
			if (error instanceof Error) {
				logMessage(index, total, `Failed to get IP: ${error.message}`, 'error')
			} else {
				logMessage(index, total, `Failed to get IP`, 'error')
			}
			return false
		}
	}

	public async getRandomProxy(index: number, total: number): Promise<string | null> {
		if (this.proxyList.length === 0) {
			this.axiosConfig = {}
			await this.checkIP(index, total)
			return null
		}

		// Continue using the node even if it is unavailable, do not try other proxies
		const proxy = this.proxyList[(index - 1) % this.proxyList.length]
		const agent = this.getProxyAgent(proxy, index, total)
		if (agent) {
			this.axiosConfig.httpsAgent = agent
		}

		// Return the node regardless of whether it is available
		try {
			await this.checkIP(index, total)
		} catch (error) {
			logMessage(index, total, `Proxy ${proxy} may be unavailable, continuing to use it anyway`, 'warning')
		}

		return proxy
	}

	public getAllProxies(): string[] {
		return this.proxyList
	}
}

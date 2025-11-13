import chalk from 'chalk'
import fs from 'fs'
import { optimAi } from './main/optimAi'
import { ProxyManager } from './main/proxy'
import { logMessage } from './utils/logger'

const proxyManager = new ProxyManager()

async function main(): Promise<void> {
	console.log(
		chalk.cyan(`
░█▀█░█▀█░▀█▀░▀█▀░█▄█░█▀█░▀█▀
░█░█░█▀▀░░█░░░█░░█░█░█▀█░░█░
░▀▀▀░▀░░░░▀░░▀▀▀░▀░▀░▀░▀░▀▀▀
        By : El Puqus Airdrop
        github.com/ahlulmukh
      Use it at your own risk
  `)
	)

	try {
		const accounts = JSON.parse(fs.readFileSync('accounts.json', 'utf8'))
		const proxiesLoaded = proxyManager.loadProxies()
		if (!proxiesLoaded) {
			logMessage(null, null, 'Failed to load proxies, using default IP', 'warning')
		}

		// 只处理第一个账号
		if (accounts.length === 0) {
			logMessage(null, null, 'No accounts found', 'error')
			return
		}

		const firstAccount = accounts[0]
		if (!firstAccount.refreshToken) {
			logMessage(1, 1, 'Missing required refreshToken for first account', 'error')
			return
		}

		console.log(chalk.green(`Processing first account with all proxies`))
		console.log(chalk.white('-'.repeat(85)))

		// 获取所有代理
		const allProxies = proxyManager.getAllProxies()
		if (allProxies.length === 0) {
			logMessage(1, 1, 'No proxies available, using default IP', 'warning')
			// 使用默认IP处理
			const bot = new optimAi(firstAccount, null, 1, 1)
			await bot.processAccount()
			return
		}

		console.log(chalk.green(`Total proxies: ${allProxies.length}`))

		// 为第一个账号遍历所有代理
		const proxyPromises = allProxies.map(async (proxy: any, index: number) => {
			try {
				logMessage(1, 1, `Using proxy ${index + 1}/${allProxies.length}: ${proxy.host}:${proxy.port}`, 'info')
				const bot = new optimAi(firstAccount, proxy, 1, 1)
				await bot.processAccount()
			} catch (error: any) {
				logMessage(1, 1, `Failed with proxy ${index + 1}: ${error.message}`, 'error')
			}
		})

		await Promise.all(proxyPromises)
	} catch (error: any) {
		logMessage(null, null, `Error: ${error.message}`, 'error')
	}
}

main().catch(err => {
	console.error(chalk.red('Error occurred:'), err)
	process.exit(1)
})

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
			logMessage(null, null, 'Failed to load proxies, will still add default IP node', 'warning')
		}

		const proxies = proxyManager.getAllProxies() || []

		// 只处理第一个账号
		if (!Array.isArray(accounts) || accounts.length === 0) {
			logMessage(null, null, 'No accounts found in accounts.json', 'error')
		} else {
			const firstAccount = accounts[0]

			if (!firstAccount.refreshToken) {
				logMessage(1, accounts.length, 'First account missing required refreshToken', 'error')
			} else {
				console.log(chalk.green(`Processing 1 account with ${proxies.length} proxies...`))
				console.log(chalk.white('-'.repeat(85)))

				const bots = proxies.map((proxy, i) => {
					return new optimAi(firstAccount, proxy, i + 1, proxies.length)
				})
				// 添加当前主机 IP
				bots.push(new optimAi(firstAccount, null, 1, 1))

				bots.forEach(async (bot, i) => {
					try {
						await bot.processAccount()
						logMessage(1, proxies.length, `Successfully processed with proxy ${i + 1}`, 'info')
					} catch (error: any) {
						logMessage(1, proxies.length, `Failed with proxy ${i + 1}: ${error?.message || error}`, 'error')
					}
				})
			}
		}
	} catch (error: any) {
		logMessage(null, null, `Error: ${(error as any).message}`, 'error')
	}
}

main().catch(err => {
	console.error(chalk.red('Error occurred:'), err)
	process.exit(1)
})

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

    // Use only the first account
    if (accounts.length > 0) {
      const firstAccount = accounts[0]
      console.log(chalk.green(`Total accounts: 1 (only using first account)`))
      console.log(chalk.white('-'.repeat(85)))
      
      try {
        if (!firstAccount.refreshToken) {
          logMessage(1, 1, 'Missing required refreshToken', 'error')
          return
        }
        
        // Iterate through all nodes and create instances for the first account
        const proxyPromises = []
        for (let i = 0; i < Math.max(proxyManager['proxyList'].length, 1); i++) {
          const currentProxy = await proxyManager.getRandomProxy(i + 1, proxyManager['proxyList'].length)
          const bot = new optimAi(firstAccount, currentProxy, i + 1, proxyManager['proxyList'].length)
          proxyPromises.push(bot.processAccount())
        }
        await Promise.all(proxyPromises)
      } catch (error: any) {
        logMessage(1, 1, `Failed to process account: ${error.message}`, 'error')
      }
    } else {
      logMessage(null, null, 'No accounts found in accounts.json', 'error')
    }
  } catch (error: any) {
    logMessage(null, null, `Error: ${(error as any).message}`, 'error')
  }
}

main().catch((err) => {
  console.error(chalk.red('Error occurred:'), err)
  process.exit(1)
})
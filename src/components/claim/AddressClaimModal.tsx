import { Trans } from '@lingui/macro'
import axios from 'axios'
import { SupportedChainId } from 'constants/chains'
import { REFRESH_TIMEOUT } from 'constants/misc'
import { useEffect, useState } from 'react'
import ConnectionInstance from 'state/connection/instance'
import { ConnectionType, getRPCURL } from 'state/connection/reducer'
import { useChainId } from 'state/user/hooks'
import { SignAndSubmitTransaction, useAccount, useAccountPubkey, useConnectedWallets } from 'state/wallets/hooks'
import styled from 'styled-components/macro'

import { SWAP_DEPLOYER_ADDRESS } from '../../constants/coinInfo'
import { useIsTransactionPending } from '../../state/transactions/hooks'
import { CloseIcon, ExternalLink, ThemedText } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import { Break, CardSection, DataCard } from '../earn/styled'
import { CardBGImage, CardNoise } from '../earn/styled'
import Modal from '../Modal'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #021d43 100%);
`

const ConfirmOrLoadingWrapper = styled.div<{ activeBG: boolean }>`
  width: 100%;
  padding: 24px;
  position: relative;
  background: ${({ activeBG }) =>
    activeBG &&
    'radial-gradient(76.02% 75.41% at 1.84% 0%, rgba(255, 0, 122, 0.2) 0%, rgba(33, 114, 229, 0.2) 100%), #FFFFFF;'};
`

export default function AddressClaimModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const account = useAccount()
  const accountPubkey = useAccountPubkey()
  const chainId = useChainId()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const [sinceBTC, setSinceBTC] = useState<Date>(new Date(0))
  const [sinceUSDT, setSinceUSDT] = useState<Date>(new Date(0))
  const [timeNow, setTimeNow] = useState(Date.now())

  const [connectedWallets] = useConnectedWallets()

  // useEffect(() => {
  //   if ([SupportedChainId.APTOS_TESTNET].includes(chainId)) {
  //     setInterval(() => {
  //       setTimeNow(Date.now())
  //     }, 1e3)
  //   }
  // }, [])
  const formatTime = (time: number) => {
    const totalSeconds = Math.floor(time / 1e3)
    if (totalSeconds <= 0) return ''
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const period = 60 * 1e3 // 1min

  // monitor the status of the claim from contracts and txns
  const claimPending = useIsTransactionPending(hash ?? '')
  const claimConfirmed = hash && !claimPending

  async function faucetMOVE() {
    const rpc = getRPCURL(ConnectionType.DEFAULT, chainId)
    await axios({
      method: 'post',
      url: rpc + '/mint?pub_key=' + accountPubkey,
    })
    setTimeout(() => {
      ConnectionInstance.getCoinBalance(chainId, account, `0x1::aptos_coin::AptosCoin`)
    }, REFRESH_TIMEOUT)
  }

  async function faucetBTC() {
    const transaction = {
      type: 'entry_function_payload',
      function: `${SWAP_DEPLOYER_ADDRESS}::FaucetV1::request`,
      type_arguments: [`${SWAP_DEPLOYER_ADDRESS}::TestCoinsV1::BTC`],
      arguments: [SWAP_DEPLOYER_ADDRESS],
    }
    await SignAndSubmitTransaction(chainId, transaction)
    setTimeout(() => {
      updateSinceTimeBTC()
      ConnectionInstance.getCoinBalance(chainId, account, `${SWAP_DEPLOYER_ADDRESS}::TestCoinsV1::BTC`)
    }, REFRESH_TIMEOUT)
  }

  async function updateSinceTimeBTC() {
    if (account) {
      const res = await ConnectionInstance.getAccountResource(
        account,
        `${SWAP_DEPLOYER_ADDRESS}::FaucetV1::Restricted<${SWAP_DEPLOYER_ADDRESS}::TestCoinsV1::BTC>`
      )
      if (res && res.since) {
        const date = new Date(Number(res.since * 1e3) + period)
        setSinceBTC(date)
      } else {
        setSinceBTC(new Date(0))
      }
    }
  }

  async function faucetUSDT() {
    const transaction = {
      type: 'entry_function_payload',
      function: `${SWAP_DEPLOYER_ADDRESS}::FaucetV1::request`,
      type_arguments: [`${SWAP_DEPLOYER_ADDRESS}::TestCoinsV1::USDT`],
      arguments: [SWAP_DEPLOYER_ADDRESS],
    }
    await SignAndSubmitTransaction(chainId, transaction)
    setTimeout(() => {
      updateSinceTimeUSDT()
      ConnectionInstance.getCoinBalance(chainId, account, `${SWAP_DEPLOYER_ADDRESS}::TestCoinsV1::USDT`)
    }, REFRESH_TIMEOUT)
  }

  async function updateSinceTimeUSDT() {
    if (account) {
      const res = await ConnectionInstance.getAccountResource(
        account,
        `${SWAP_DEPLOYER_ADDRESS}::FaucetV1::Restricted<${SWAP_DEPLOYER_ADDRESS}::TestCoinsV1::USDT>`
      )
      if (res && res.since) {
        const date = new Date(Number(res.since * 1e3) + period)
        setSinceUSDT(date)
      } else {
        setSinceUSDT(new Date(0))
      }
    }
  }

  // useEffect(() => {
  //   if ([SupportedChainId.APTOS_TESTNET].includes(chainId)) {
  //     updateSinceTimeBTC()
  //     updateSinceTimeUSDT()
  //   }
  // }, [account, chainId])

  function wrappedOnDismiss() {
    setAttempting(false)
    setHash(undefined)
    onDismiss()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && (
        <ContentWrapper gap="lg">
          <ModalUpper>
            <CardBGImage />
            <CardNoise />
            <CardSection gap="md">
              <RowBetween>
                <ThemedText.DeprecatedWhite fontWeight={500}>
                  <Trans>Faucet of Test Coins</Trans>
                </ThemedText.DeprecatedWhite>
                <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} stroke="white" />
              </RowBetween>
            </CardSection>
            <Break />
          </ModalUpper>
          <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0', paddingBottom: '0' }} justify="start">
            <ThemedText.DeprecatedSubHeader fontWeight={500}>
              Get APT coin from wallet airdrop.
            </ThemedText.DeprecatedSubHeader>
            <ThemedText.DeprecatedSubHeader fontWeight={500}>
              Get test BTC USDT for AnimeSwap testing, test coins are no practical value on Aptos DevNet.
            </ThemedText.DeprecatedSubHeader>
          </AutoColumn>
          <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0', paddingBottom: '2rem' }} justify="center">
            <ButtonPrimary
              disabled={!account}
              padding="16px 16px"
              width="100%"
              $borderRadius="12px"
              mt="1rem"
              onClick={() => {
                faucetMOVE()
              }}
            >
              Mint MOVE
            </ButtonPrimary>
            <ButtonPrimary
              disabled={!account || sinceBTC.getTime() > timeNow}
              padding="16px 16px"
              width="100%"
              $borderRadius="12px"
              mt="1rem"
              onClick={() => {
                faucetBTC()
              }}
            >
              {formatTime(sinceBTC.getTime() - timeNow)} Mint BTC
            </ButtonPrimary>
            <ButtonPrimary
              disabled={!account || sinceUSDT.getTime() > timeNow}
              padding="16px 16px"
              width="100%"
              $borderRadius="12px"
              mt="1rem"
              onClick={() => {
                faucetUSDT()
              }}
            >
              {formatTime(sinceUSDT.getTime() - timeNow)} Mint USDT
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {(attempting || claimConfirmed) && (
        <ConfirmOrLoadingWrapper activeBG={true}>
          <CardNoise />
          <RowBetween>
            <div />
            <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} stroke="black" />
          </RowBetween>
          <AutoColumn gap="100px" justify={'center'}>
            <AutoColumn gap="12px" justify={'center'}>
              <ThemedText.DeprecatedLargeHeader fontWeight={600} color="black">
                {claimConfirmed ? <Trans>Claimed</Trans> : <Trans>Claiming</Trans>}
              </ThemedText.DeprecatedLargeHeader>
            </AutoColumn>
            {claimConfirmed && (
              <>
                <ThemedText.DeprecatedSubHeader fontWeight={500} color="black">
                  <span role="img" aria-label="party-hat">
                    🎉{' '}
                  </span>
                  <Trans>Welcome to team Unicorn :) </Trans>
                  <span role="img" aria-label="party-hat">
                    🎉
                  </span>
                </ThemedText.DeprecatedSubHeader>
              </>
            )}
            {attempting && !hash && (
              <ThemedText.DeprecatedSubHeader color="black">
                <Trans>Confirm this transaction in your wallet</Trans>
              </ThemedText.DeprecatedSubHeader>
            )}
            {attempting && hash && !claimConfirmed && chainId && hash && (
              <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)} style={{ zIndex: 99 }}>
                <Trans>View transaction on Explorer</Trans>
              </ExternalLink>
            )}
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
    </Modal>
  )
}

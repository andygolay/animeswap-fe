import { ReactComponent as Blog } from 'assets/blog.svg'
import { ReactComponent as Discord } from 'assets/discord.svg'
import { ReactComponent as GitHub } from 'assets/github.svg'
import { ReactComponent as Help } from 'assets/help.svg'
import { ReactComponent as Twitter } from 'assets/twitter.svg'
import styled from 'styled-components/macro'

const FooterItem = styled.a`
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  fill: ${({ theme }) => theme.deprecated_text3};
  :hover {
    fill: ${({ theme }) => theme.deprecated_text2};
  }
`

export default function Footer() {
  return (
    <>
      <FooterItem target="_blank" href="https://docs.movementlabs.xyz/" rel="noreferrer">
        <Blog width="28px" height="28px"></Blog>
      </FooterItem>
      <FooterItem target="_blank" href="https://discord.gg/3kTcXXmvXJ" rel="noreferrer">
        <Discord width="28px" height="28px"></Discord>
      </FooterItem>
      <FooterItem target="_blank" href="https://twitter.com/movementlabsxyz" rel="noreferrer">
        <Twitter width="28px" height="28px"></Twitter>
      </FooterItem>
      <FooterItem target="_blank" href="https://github.com/movemntdev" rel="noreferrer">
        <GitHub width="28px" height="28px"></GitHub>
      </FooterItem>
      <FooterItem target="_blank" href="https://movementlabs.xyz/" rel="noreferrer">
        <Help width="28px" height="28px"></Help>
      </FooterItem>
    </>
  )
}


import { css } from "uebersicht"

export const command = undefined;

export const refreshFrequency = false;

const frame = css`
  width: 100%;
  height: 100%;
  aspect-ratio: 1/1;
  border: 0;
  overflow: hidden;
`

export const className = `
  left: 60px;
  bottom: 20px;
  width: 140px;
  height: 140px;
  border: 0;
  overflow: hidden;
`;

export const render = () => {
  return (
    <iframe 
      className={frame}
      title="gotchu" 
      width="100%" 
      height="100%" 
      src="{{GOTCHU_URL}}/watch?embedded=true&embeddingSource=uebersicht" />
  )
}
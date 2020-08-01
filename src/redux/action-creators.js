import { store } from './store'
import * as Constants from '../constants'

export function setHighlightCd(option) {
  store.dispatch({
    type: Constants.SET_HIGHLIGHT_CD,
    option
  });
}

export function setHoverCd(option) {
  store.dispatch({
    type: Constants.SET_HOVER_CD,
    option
  });
}

export function setSelectCd(option) {
  store.dispatch({
    type: Constants.SET_SELECT_CD,
    option
  });
}


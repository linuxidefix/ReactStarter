/*
 * #%L
 * React Site Starter
 * %%
 * Copyright (C) 2009 - 2017 Broadleaf Commerce
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *       http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
import { createSelector } from 'reselect'
import { formValueSelector } from 'redux-form'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import find from 'lodash/find'
import omit from 'lodash/omit'

// need to select address and fulfillmentOptionId
export const getInitialShippingValues = createSelector(
    state => state.cart.fulfillmentGroup,
    (fulfillmentGroup) => {
        if (!fulfillmentGroup) {
            return {}
        }

        const shippableFulfillmentGroup = find(fulfillmentGroup, fg => !['DIGITAL', 'GIFT_CARD', 'PHYSICAL_PICKUP'].includes(fg.fulfillmentType))

        const { address, fulfillmentOption, ...rest } = shippableFulfillmentGroup

        return {
            ...rest,
            address: {
                ...address,
                isoCountryAlpha2: {
                    alpha2: 'US'
                },
            },
            fulfillmentOption: {
                id: fulfillmentOption && `${fulfillmentOption.id}` || undefined
            }
        }
    }
)

const formSelector = formValueSelector('CreditCardMethodForm')

export const getInitialCreditCardValues = createSelector(
    state => state.cart.payment,
    state => state.cart.fulfillmentGroup,
    state => formSelector(state, 'address', 'creditCard', 'shouldSaveNewPayment', 'shouldUseShippingAddress'),
    state => state.storedPayment,
    (payment, fulfillmentGroup, { address, creditCard, shouldSaveNewPayment, shouldUseShippingAddress }, storedCreditCard) => {

        let billingAddress = omit(address, ['isoCountryAlpha2'])

        if (payment) {
            const defaultPayment = find(payment, { gatewayType: 'Temporary' })
            if (defaultPayment) {
                billingAddress = defaultPayment && defaultPayment.billingAddress
            }
        }

        if (shouldUseShippingAddress) {
            const shippableFulfillmentGroup = find(fulfillmentGroup, fg => !['DIGITAL', 'GIFT_CARD', 'PHYSICAL_PICKUP'].includes(fg.fulfillmentType))

            if (shippableFulfillmentGroup && isEmpty(billingAddress)) {
                billingAddress = omit(shippableFulfillmentGroup.address, ['id', 'phonePrimary.id', 'customerAddressId', 'customerAddressName'])
            }
        }

        return {
            address: {
                ...billingAddress,
                isoCountryAlpha2: {
                    alpha2: 'US'
                },
            },
            creditCard: !isEmpty(creditCard) ? creditCard : {
                creditCardNumber: '4111111111111111',
                creditCardExpDate: '01/99',
                creditCardCvv: '123',
                ...storedCreditCard,
            },
            shouldSaveNewPayment,
            shouldUseShippingAddress,
        }
    }
)

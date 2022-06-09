/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from '../containers/Bills';

import router from "../app/Router.js";
import { ROUTES } from "../constants/routes.js";
import userEvent from '@testing-library/user-event'
import mockStore from "../__mocks__/store"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(screen.getByTestId('icon-window').classList.contains('active-icon')).toBeTruthy()

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe('When I am on Bills Page, i click on the new bill button', () => {
    test('I should be sent to the new bill page', () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname
        })
      }
      document.body.innerHTML = BillsUI({
        data: bills
      })
      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        bills,
        localStorage: window.localStorage
      })
      $.fn.modal = jest.fn()

      const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e))

      const iconNewBill = screen.getByTestId('btn-new-bill')
      iconNewBill.addEventListener('click', handleClickNewBill)
      fireEvent.click(iconNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()

      const modale = screen.getAllByTestId('form-new-bill')
      expect(modale).toBeTruthy()
    })
  })

  describe('When I am on Bills Page, I click on the eye icon', () => {
    test('A modal of proof should open', () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname
        })
      }
      document.body.innerHTML = BillsUI({
        data: bills
      })
      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        bills,
        localStorage: window.localStorage
      })
      $.fn.modal = jest.fn()

      const handleClickIconEye = jest.fn(bill.handleClickIconEye)
      const eye = screen.getAllByTestId('icon-eye')[0]
      eye.addEventListener('click', handleClickIconEye(eye))
      userEvent.click(eye)
      expect(handleClickIconEye).toHaveBeenCalled()
    })
  })

  describe('When I am on Bills Page', () => {
    test('Then return bills data', () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      mockStore.bills = jest.fn().mockImplementationOnce(() => {
        return {
          list: jest.fn().mockResolvedValue([{ id: 1, data: () => ({ date: '' }) }])
        }
      })

      const bills = new Bills({
        document, onNavigate, store: mockStore, localStorage
      })

      const res = bills.getBills()

      expect(res).toEqual(Promise.resolve({}))
    })
  })
})

// test d'intégration GET
describe("Given I am a user connected as employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        const html = BillsUI({ error: "Erreur 404" })
        document.body.innerHTML = html
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        const html = BillsUI({ error: "Erreur 500" })
        document.body.innerHTML = html
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
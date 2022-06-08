/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES } from "../constants/routes.js";
import userEvent from '@testing-library/user-event'
import mockStore from "../__mocks__/store"
import BillsUI from "../views/BillsUI.js"

// window.alert = jest.fn()
jest.spyOn(window, 'alert').mockImplementation(() => { });

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form is displayed", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })

    describe('When I am on Bills Page, i click on "Browse" for upload an image file', () => {
      test('Then I should sent an image file', () => {
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const html = NewBillUI()
        document.body.innerHTML = html
        const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        })
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
        const selectFile = screen.getByTestId('file')
        const testFile = new File(['This is a test'], 'test.jpg', {
          type: 'image/jpeg',
        })

        selectFile.addEventListener('change', handleChangeFile)
        //Les Events correspondent aux événements que vous pouvez simuler sur le DOM
        fireEvent.change(selectFile, { target: { files: [testFile] } })

        expect(handleChangeFile).toHaveBeenCalled()
        expect(selectFile.files[0]).toStrictEqual(testFile)
      })

      test("Then I should not sent a non image file", () => {
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const html = NewBillUI()
        document.body.innerHTML = html
        const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        })
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
        const selectFile = screen.getByTestId('file')
        const testFile = new File(['This is a test'], 'test.txt', {
          type: 'text/plain',
        })

        selectFile.addEventListener('change', handleChangeFile)
        fireEvent.change(selectFile, { target: { files: [testFile] } })

        expect(handleChangeFile).toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalled()
      })
    })

    describe('When I post a new bill', () => {
      test('Then I should be sent to the Bills page', async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const html = NewBillUI()
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        })
        const formNewBill = screen.getByTestId('form-new-bill')
        expect(formNewBill).toBeTruthy()

        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        formNewBill.addEventListener('submit', handleSubmit)
        //event de soumission du formulaire simulé dans le DOM
        fireEvent.submit(formNewBill)
        expect(handleSubmit).toHaveBeenCalled()
        expect(screen.getByText('Mes notes de frais')).toBeTruthy()
      })
    })
  })
})

// test d'intégration POST
describe('Given I am connected as an employee', () => {
  jest.spyOn(mockStore, 'bills')
  describe('When I post a new bill', () => {
    test('Then I should be send to the Bills page', () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })
      const validBillTest = {
        type: 'Transport',
        name: 'Test',
        date: '2022-03-22',
        amount: 60,
        vat: 12,
        pct: 20,
        commentary: 'Test',
        fileUrl:
          'https://www.themoviedb.org/t/p/w440_and_h660_face/5OCzQvJ0ePPx66OPGVC6ga9bUUQ.jpg',
        fileName: '5OCzQvJ0ePPx66OPGVC6ga9bUUQ.jpg',
        status: 'pending'
      }

      // chargement des valeurs dans les champs de saisie simulés dans le DOM
      screen.getByTestId('expense-type').value = validBillTest.type
      screen.getByTestId('expense-name').value = validBillTest.name
      screen.getByTestId('datepicker').value = validBillTest.date
      screen.getByTestId('amount').value = validBillTest.amount
      screen.getByTestId('vat').value = validBillTest.vat
      screen.getByTestId('pct').value = validBillTest.pct
      screen.getByTestId('commentary').value = validBillTest.commentary

      newBill.fileName = validBillTest.fileName
      newBill.fileUrl = validBillTest.fileUrl

      newBill.updateBill = jest.fn()
      //click submit (simulé dans le DOM)
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

      const form = screen.getByTestId('form-new-bill')
      form.addEventListener('submit', handleSubmit)
      expect(screen.getByText('Envoyer').type).toBe('submit')

      userEvent.click(screen.getByText('Envoyer'))

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBill.updateBill).toHaveBeenCalled()
    })

    // Errors 404 and 500 test
    describe('When an error occurs on API', () => {
      test('create bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error('Erreur 404'))
            },
          }
        })
        const html = BillsUI({ error: 'Erreur 404' })
        document.body.innerHTML = html
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test('fetches messages from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error('Erreur 500'))
            },
          }
        })

        const html = BillsUI({ error: 'Erreur 500' })
        document.body.innerHTML = html
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
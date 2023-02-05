/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

// simule un module avec une version mockée
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {

  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))


  describe("When I am on Bills Page", () => {
    // test l'icone de la facture est cliquable 
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })

    // test la page de chargement est affichée
    describe("When I am on Bills Page but it is loading", () => {
      test("Then, Loading page should be rendered", () => {
        const html = BillsUI({ data: bills, loading: true });
        document.body.innerHTML = html
        const loading = screen.getAllByText('Loading...')
        expect(loading).toBeTruthy()
      })
    })

    // test la page d'erreur est affichée
    describe("When I am on Bills Page but back-end send an error message", () => {
      test("Then, Error page should be rendered", () => {
        const html = BillsUI({ data: bills, error: true });
        document.body.innerHTML = html
        const error = screen.getAllByText('Erreur')
        expect(error).toBeTruthy()
      })
    })

    // test les notes de frais sont affichées de la plus récente à la plus ancienne
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^([1-9]|[12][0-9]|3[01])[ ]\b.{3}\b[.][ ]\d{2}$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // test la modal est affichée
  describe("When I am on Bills Page and I click on the eye icon", () => {
    test("Then a modal should open", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      const html = BillsUI({ data: bills })
      document.body.innerHTML = html

      $.fn.modal = jest.fn() // Permet d'éviter les erreurs Jquery
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const billsContainer = new Bills({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleShowModalFile = jest.fn((e) => { billsContainer.handleClickIconEye(e.target) })

      iconEye.addEventListener('click', handleShowModalFile)
      userEvent.click(iconEye)

      expect(handleShowModalFile).toHaveBeenCalled()
      expect(screen.getAllByText('Justificatif')).toBeTruthy()
    })
  })
})

// Test d'intégration GET Bills 

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {

    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy()
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          "localStorage",
          { value: localStorageMock }
        );
        window.localStorage.setItem("user", JSON.stringify({
          type: "Employee",
          email: "a@a"
        }));
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      // test l'erreur 404 est affichée quand l'API ne répond pas
      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Dashboard)
        await new Promise(process.nextTick);
        const errorMessage = await waitFor(() => screen.getByText(/Erreur 404/))
        expect(errorMessage).toBeTruthy()
      })

      // test l'erreur 500 est affichée quand l'API ne répond pas
      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const errorMessage = await waitFor(() => screen.getByText(/Erreur 500/))
        expect(errorMessage).toBeTruthy()
      })
    })
  })
})
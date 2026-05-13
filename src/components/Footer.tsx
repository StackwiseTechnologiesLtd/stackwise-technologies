import { Instagram, Twitter } from "@deemlol/next-icons";

export default function Footer() {
    const currentYear = new Date().getFullYear();

  return (
      <footer className="nk-footer">
          <div className="container">
              <div className="nk-footer-bar border-top border-light py-15 py-lg-10">
                  <div className="row justify-content-center gy-2 gx-3">
                      <div className="col-lg-6">
                          <p className="mb-0">
                              Stackwise Technologie Limited &copy; {currentYear} - Engineered for Scale
                          </p>
                      </div>
                      <div className="col-lg-6">
                          <ul className="nk-list-inline gap-6 fs-9 justify-content-lg-end">
                              <li>
                                  <a className="link-content" href="https://x.com/StackwiseTech">
                                      <Twitter className="icon ni ni-facebook-circle" color="#FFFFFF" strokeWidth={1.5} />
                                    </a>
                              </li>
                              <li>
                                  <a className="link-content" href="https://x.com/StackwiseTech">
                                      <Instagram className="icon ni ni-facebook-circle" color="#FFFFFF" strokeWidth={1.5} />
                                    </a>
                              </li>
                              
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      </footer>
  )
}

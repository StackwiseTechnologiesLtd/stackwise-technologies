import Image from "next/image";
import { CheckCircle } from "@deemlol/next-icons";

function Header() {
  return (
    <header className="nk-header min-vh-100 d-flex flex-column" id="home">
      <div
        className="nk-menubar js-menubar-fixed was-transparent"
        id="menu-bar"
        data-gsap-in='{"opacity": 0, "y": 50}'
        data-gsap-delay="3.3"
      >
        <div className="container">
          <div className="nk-menubar-warper">
            <div className="nk-menu-background"></div>
            <div className="nk-logo">
              <Image
                width={100}
                height={100}
                src="/images/logo.svg"
                alt="logo"
                style={{ scale: "1.5", marginLeft: "1.4rem" }}
              />{" "}
            </div>
            <div className="nk-menu-toggle d-xl-none">
              <button
                data-nk-target="menu-bar"
                data-nk-overlay="menu-bar-overlay"
                className="js-menu-toggl icon-switch btn btn-icon btn-glow"
              >
                <em className="icon icon-inactive ni ni-menu"></em>
                <em className="icon icon-active ni ni-cross"></em>
              </button>
            </div>
            <div className="nk-menu">
              <ul className="nk-menu-list"></ul>
              <ul className="nk-menu-tools flex-xl-row-reverse column-gap-6">
                <li>
                  <a
                    href="https://calendly.com/stackwisetechnologies-info/30min"
                    className="btn btn-line-animated"
                  >
                    <span>Book a call !</span>
                    <div className="beam-container">
                      <div className="beam-slide">
                        <div className="beam-conic"></div>
                      </div>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
            <div id="menu-bar-overlay" className="nk-menu-overlay"></div>
          </div>
        </div>
      </div>
      <div className="nk-hero flex-grow-1 d-flex flex-column">
        <div className="nk-hero-content py-12 pt-lg-27 pb-lg-31 my-auto">
          <div className="container">
            <div className="row align-items-center justify-content-center justify-content-lg-between gy-6">
              <div className="col-md-10 col-lg-6 col-xl-5">
                <div className="nk-hero-content text-center text-lg-start">
                  <h1
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay="3.3"
                    className="nk-hero-title fw-normal mb-4"
                  >
                    Engineering Scalable Software for Modern Businesses
                  </h1>
                  <p
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay="3.4"
                    className="lead mb-7"
                  >
                    We help startups, SMEs, and enterprise teams build scalable
                    web platforms, AI systems, mobile applications, and business
                    automation solutions tailored to their operations.
                  </p>

                  <ul
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay="3.6"
                    className="nk-list-inline column-gap-10 fs-8 justify-content-center justify-content-lg-start"
                  >
                    <li>
                      <CheckCircle className="icon text-success lh-inherit ni ni-check-thick" />
                      <span>Rapid development cycles </span>
                    </li>
                    <li>
                      <CheckCircle className="icon text-success lh-inherit ni ni-check-thick" />
                      <span>Enterprise-grade architecture </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-6 col-xl-6">
                <div className="nk-hero-image ms-lg-n4 me-lg-n30 my-n15p my-lg-n20p position-relative d-flex justify-content-center">
                  <Image
                    width={690}
                    height={642.71}
                    data-gsap-in='{"opacity": 0, "scale": 0.8}'
                    data-gsap-delay="3.6"
                    className="position-relative"
                    src="/images/hero-screen.png"
                    alt="hero"
                    style={{ width: "42rem", maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* our partners: TEMPS International, ALEMNET, APOLLO GYM, OPEN sarl */}
        <div className="nk-hero-footer pb-16">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-10">
                <ul
                  className="nk-list-inline justify-content-around row-gap-2 column-gap-8"
                  data-gsap-in='{"opacity": 0, "y": 50}'
                  data-gsap-delay="3.8"
                >
                  <li>
                    <Image
                      width={100}
                      height={100}
                      src="/images/paypal2x.png"
                      alt=""
                    />
                  </li>
                  <li>
                    <Image
                      width={100}
                      height={100}
                      src="/images/stripe2x.png"
                      alt=""
                    />
                  </li>
                  <li>
                    <Image
                      width={100}
                      height={100}
                      src="/images/node2x.png"
                      alt=""
                    />
                  </li>
                  <li>
                    <Image
                      width={100}
                      height={100}
                      src="/images/php2x.png"
                      alt=""
                    />
                  </li>
                  <li>
                    <Image
                      width={100}
                      height={100}
                      src="/images/ebay2x.png"
                      alt=""
                    />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

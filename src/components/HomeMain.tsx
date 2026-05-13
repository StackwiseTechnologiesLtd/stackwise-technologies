import React from "react";
import Image from "next/image";

export default function HomeMain() {
  return (
    <main className="nk-main">
      <div className="gradient-separator mt-n4"></div>
      <div id="solution" className="section section-xl pb-0 has-mask">
        <div className="bg-mask nk-star-field" data-star-count="100"></div>
        <div className="section-heading">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-6 col-lg-8">
                <div className="position-relative text-center">
                  <div
                    data-gsap-in='{"opacity": 0}'
                    data-gsap-delay="1"
                    className="bg-pattern-grid pattern-grid-size-xs blend-around-large bg-mask bg-primary bg-opacity-10 mt-n10p"
                  ></div>
                  {/* <div
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".1"
                    className="badge badge-glow border-lighter text-gradient-b"
                  >
                    Solution
                  </div> */}
                  <h2
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".15"
                    className="title fw-normal fs-1"
                  >
                    More Than{" "}
                    <span className="no-split text-gradient-a">
                      Development
                    </span>
                    <br className="d-none d-md-block" /> A Strategic Technology
                    Partner
                  </h2>
                  <p
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".2"
                    className="fs-8"
                  >
                    Stackwise Technologies Limited delivers custom software
                    solutions designed around your business goals. We combine
                    engineering expertise, AI capabilities, and scalable
                    architecture to help companies modernize operations, launch
                    digital products, and accelerate growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="section-content">
          <div className="container">
            <div className="row gy-2 gy-lg-10">
              <div className="col-md-6 col-lg-4">
                <div
                  data-gsap-in='{"opacity": 0, "y": 50}'
                  data-gsap-delay=".15"
                  className="card card-border-glow card-blend card-blend-bottom"
                >
                  <div className="card-body">
                    <div className="card-content">
                      <h5 className="title fs-6 text-gradient-heading">
                        Custom Software Development
                      </h5>
                      <p>
                        We build secure, scalable, and maintainable web
                        platforms, internal systems, APIs, and enterprise
                        applications tailored to your exact business workflows.
                      </p>
                    </div>
                    <div className="card-gfx me-n12 ms-n7 mt-n5">
                      <Image
                        width={100}
                        height={100}
                        className="w-100"
                        src="/images/solution-a.png"
                        alt="card"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div
                  data-gsap-in='{"opacity": 0, "y": 50}'
                  data-gsap-delay=".15"
                  className="card card-border-glow card-blend card-blend-bottom"
                >
                  <div className="card-body">
                    <div className="card-content">
                      <h5 className="title fs-6 text-gradient-heading">
                        Dedicated Development Teams
                      </h5>
                      <p>
                        Extend your engineering capacity with experienced
                        developers, designers, and AI engineers working as an
                        integrated part of your team.
                      </p>
                    </div>
                    <div className="card-gfx me-n13 ms-n7 mt-n5">
                      <Image
                        width={100}
                        height={100}
                        className="w-100"
                        src="/images/solution-b.png"
                        alt="card"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div
                  data-gsap-in='{"opacity": 0, "y": 50}'
                  data-gsap-delay=".15"
                  className="card card-border-glow card-blend card-blend-bottom"
                >
                  <div className="card-body">
                    <div className="card-content">
                      <h5 className="title fs-6 text-gradient-heading">
                        AI & Automation Solutions
                      </h5>
                      <p>
                        Leverage AI-powered systems, workflow automation,
                        intelligent assistants, and operational tooling to
                        reduce manual work and improve efficiency.
                      </p>
                    </div>
                    <div className="card-gfx me-n12 ms-n7 mt-n5">
                      <Image
                        width={100}
                        height={100}
                        className="w-100"
                        src="/images/solution-c.png"
                        alt="card"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="section section-xl">
        <div className="section-content">
          <div className="container">
            <div className="row align-items-center justify-content-between g-gs">
              <div className="col-lg-6 col-xl-5 order-lg-last">
                <div className="gfx my-n5p my-lg-n10p">
                  <Image
                    width={459}
                    height={322}
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".1"
                    src="/images/gfx-process.png"
                    alt="feature"
                    style={{ width: "42rem", maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="text-block">
                  {/* <div
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".1"
                    className="badge badge-glow mb-4 border-lighter text-gradient-b"
                  >
                    How we work
                  </div> */}
                  <h2
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".15"
                    className="title fs-1 fw-normal mb-3"
                  >
                    4 Simple Steps <br className="d-none d-lg-block" />
                    to Build Your
                    <span className="no-split text-gradient-a">
                      Software Solution
                    </span>
                  </h2>
                  <p
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".2"
                    className="lead"
                  >
                    From idea validation to deployment and scaling, our process
                    is designed to move quickly while maintaining engineering
                    quality and long-term scalability.
                  </p>
                  <ul
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".25"
                    className="nk-btn-list pt-3"
                  >
                    <li>
                      <a
                        href="https://calendly.com/stackwisetechnologies-info/30min"
                        className="btn btn-line-animated"
                      >
                        <span>Book a call</span>
                        <div className="beam-container">
                          <div className="beam-slide">
                            <div className="beam-conic"></div>
                          </div>
                        </div>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="section-content">
          <div className="container">
            <div className="row g-gs" data-class-rotator=".card">
              <div
                data-gsap-in='{"opacity": 0, "y": 50}'
                data-gsap-delay=".15"
                className="col-xl-3 col-md-6"
              >
                <div className="card card-s1 card-sm h-100 active">
                  <div className="card-body">
                    <h6 className="fs-8 title">1. Discovery & Strategy</h6>
                    <p className="mb-0">
                      We analyze your business goals, workflows, technical
                      requirements, and product vision to define the right
                      architecture and execution plan.
                    </p>
                  </div>
                </div>
              </div>
              <div
                data-gsap-in='{"opacity": 0, "y": 50}'
                data-gsap-delay=".15"
                className="col-xl-3 col-md-6"
              >
                <div className="card card-s1 card-sm h-100">
                  <div className="card-body">
                    <h6 className="fs-8 title">
                      2. Design & System Architecture
                    </h6>
                    <p className="mb-0">
                      Our team designs intuitive user experiences and scalable
                      backend systems optimized for performance, security, and
                      future growth.
                    </p>
                  </div>
                </div>
              </div>
              <div
                data-gsap-in='{"opacity": 0, "y": 50}'
                data-gsap-delay=".15"
                className="col-xl-3 col-md-6"
              >
                <div className="card card-s1 card-sm h-100">
                  <div className="card-body">
                    <h6 className="fs-8 title">
                      3. Agile Development & Testing
                    </h6>
                    <p className="mb-0">
                      We develop your platform using modern technologies,
                      iterative delivery cycles, automated testing, and
                      continuous feedback.
                    </p>
                  </div>
                </div>
              </div>
              <div
                data-gsap-in='{"opacity": 0, "y": 50}'
                data-gsap-delay=".15"
                className="col-xl-3 col-md-6"
              >
                <div className="card card-s1 card-sm h-100">
                  <div className="card-body">
                    <h6 className="fs-8 title">
                      4. Deployment & Long-Term Support
                    </h6>
                    <p className="mb-0">
                      We deploy your solution to production, monitor
                      performance, provide maintenance, and continue improving
                      the product as your business evolves.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="gradient-separator"></div>
      <div id="features" className="section section-xl">
        <div className="section-heading">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-9 col-xl-6">
                <div className="position-relative text-center">
                  <div
                    data-gsap-in='{"opacity": 0}'
                    data-gsap-delay="1"
                    className="bg-pattern-grid pattern-grid-size-xs blend-around-large bg-mask bg-primary bg-opacity-10 mt-n10p"
                  ></div>
                  {/* <div
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".1"
                    className="badge badge-glow border-lighter text-gradient-b"
                  >
                    Services
                  </div> */}
                  <h2
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".15"
                    className="title fs-1 fw-normal mb-7"
                  >
                    Technology Solutions
                    <small className="d-block fs-3">
                      Built for
                      <span className="no-split text-gradient-a">Growth</span>
                    </small>
                  </h2>
                  <p
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".2"
                    className="fs-8"
                  >
                    We deliver high-performance digital products and business
                    systems engineered to support operational efficiency,
                    scalability, and innovation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="section-content">
          <div className="container">
            <div className="row gy-6 gy-md-8 justify-content-center">
              <div className="col-xl-6 col-md-9">
                <div
                  data-gsap-in='{"opacity": 0, "y": 50}'
                  data-gsap-delay=".15"
                  data-gsap-start="top 95%"
                  className="gfx my-n25p my-xl-n15p px-lg-2 px-xl-7"
                >
                  <Image
                    width={576}
                    height={738}
                    className="w-100"
                    src="/images/screen-feature.png"
                    alt="feature"
                    style={{ width: "42rem", maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </div>
              <div className="col-xl-3 col-md-6 order-xl-first">
                <div className="d-flex flex-column row-gap-md-6 row-gap-xl-10 row-gap-xxl-30">
                  <div
                    data-gsap-in='{"opacity": 0, "x": -50}'
                    data-gsap-delay=".15"
                    className="card-blank"
                  >
                    <h6 className="fs-8 text-gradient-heading">
                      Web & Mobile Application Development
                    </h6>
                    <p className="mb-1">
                      We build responsive web platforms, SaaS products,
                      dashboards, mobile apps, and customer portals using modern
                      scalable technologies.
                    </p>
                  </div>
                  <div
                    data-gsap-in='{"opacity": 0, "x": -50}'
                    data-gsap-delay=".15"
                    className="card-blank"
                  >
                    <h6 className="fs-8 text-gradient-heading">
                      Cloud Infrastructure & APIs
                    </h6>
                    <p className="mb-1">
                      From backend systems and REST APIs to cloud deployment and
                      DevOps pipelines, we build reliable infrastructure that
                      scales with your business.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="d-flex flex-column row-gap-md-6 row-gap-xl-10 row-gap-xxl-30">
                  <div
                    data-gsap-in='{"opacity": 0, "x": 50}'
                    data-gsap-delay=".15"
                    className="card-blank"
                  >
                    <h6 className="fs-8 text-gradient-heading">
                      AI Integration & Automation
                    </h6>
                    <p className="mb-1">
                      Integrate AI into your business with intelligent
                      assistants, automation workflows, predictive systems, and
                      custom operational tools.
                    </p>
                  </div>
                  <div
                    data-gsap-in='{"opacity": 0, "x": 50}'
                    data-gsap-delay=".15"
                    className="card-blank"
                  >
                    <h6 className="fs-8 text-gradient-heading">
                      Data Analytics & Business Intelligence
                    </h6>
                    <p className="mb-1">
                      Transform business data into actionable insights through
                      reporting dashboards, analytics platforms, and intelligent
                      decision-making systems.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="gradient-separator"></div>
      <div className="section section-xl">
        <div className="section-content">
          <div
            className="container"
            data-gsap-in='{"opacity": 0, "y": 50}'
            data-gsap-delay="3.5"
            data-gsap-mobile-delay="0"
          >
            <div className="row justify-content-between gy-8">
              <div className="col-lg-6 col-xxl-5">
                <div className="text-block py-3">
                  <div className="mb-7">
                    <h2
                      data-gsap-in='{"opacity": 0, "y": 50}'
                      data-gsap-delay=".15"
                      className="title fs-1 fw-normal mb-4"
                    >
                      Let’s Build Something
                      <span className="no-split text-gradient-a">
                        Exceptional
                      </span>
                    </h2>
                    <p
                      data-gsap-in='{"opacity": 0, "y": 50}'
                      data-gsap-delay=".15"
                      className="lead"
                    >
                      Ready to develop your next platform, automate operations,
                      or scale your technology infrastructure? Contact Stackwise
                      Technologies Limited to discuss your project.
                    </p>
                  </div>
                  <div className="d-flex flex-column gap-5">
                    <div
                      data-gsap-in='{"opacity": 0, "y": 50}'
                      data-gsap-delay=".15"
                      className="card-blank d-flex align-items-center gap-4"
                    >
                      <div className="position-relative">
                        <h6 className="fs-8 text-gradient-heading">
                          Our Address
                        </h6>
                        <p className="mb-0">
                          123 Street, New York City,
                          <br className="d-none d-md-block" />
                          United States Of America
                        </p>
                      </div>
                    </div>
                    <div
                      data-gsap-in='{"opacity": 0, "y": 50}'
                      data-gsap-delay=".15"
                      className="card-blank d-flex align-items-center gap-4"
                    >
                      <div className="position-relative">
                        <h6 className="fs-8 text-gradient-heading">
                          Phone Number
                        </h6>
                        <p className="mb-0">
                          Office: 1-800-222-4545, 1-800-222-4545
                        </p>
                      </div>
                    </div>
                    <div
                      data-gsap-in='{"opacity": 0, "y": 50}'
                      data-gsap-delay=".15"
                      className="card-blank d-flex align-items-center gap-4"
                    >
                      <div className="position-relative">
                        <h6 className="fs-8 text-gradient-heading">
                          Email Address
                        </h6>
                        <p className="mb-0">
                          <a
                            href="/cdn-cgi/l/email-protection"
                            className="__cf_email__"
                          >
                            info@stackwisetechnologies.com
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div
                  className="card card-blend card-blend-bottom card-border-glow card-border-glow-sm"
                  data-gsap-in='{"opacity": 0, "y": 50}'
                  data-gsap-delay=".15"
                >
                  <div className="card-body">
                    <form action="#" className="contact-form">
                      <div className="row gx-gs gy-5">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="first-name">
                              First Name
                            </label>
                            <div className="form-control-wrap">
                              <input
                                type="text"
                                id="first-name"
                                className="form-control form-control-xl"
                                placeholder="Enter your first name"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label className="form-label" htmlFor="last-name">
                              Last Name
                            </label>
                            <div className="form-control-wrap">
                              <input
                                type="text"
                                id="last-name"
                                className="form-control form-control-xl"
                                placeholder="Enter your last name"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="form-group">
                            <label
                              className="form-label"
                              htmlFor="email-address"
                            >
                              Email
                            </label>
                            <div className="form-control-wrap">
                              <input
                                type="email"
                                id="email-address"
                                className="form-control form-control-xl"
                                placeholder="Enter your email"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="form-group">
                            <label
                              className="form-label"
                              htmlFor="connect-with"
                            >
                              Select a service to get started
                            </label>
                            <div className="form-control-wrap">
                              <select
                                name="connect-with"
                                id="connect-with"
                                className="form-control form-control-xl"
                              >
                                <option value="" disabled selected>
                                  Select a service to get started
                                </option>
                                <option value="Custom Software Development">
                                  Custom Software Development
                                </option>
                                <option value="Web Application Development">
                                  Web Application Development
                                </option>
                                <option value="Mobile App Development">
                                  Mobile App Development
                                </option>
                                <option value="AI & Automation">
                                  AI & Automation
                                </option>
                                <option value="UI/UX Design">
                                  UI/UX Design
                                </option>
                                <option value="Cloud & DevOps">
                                  Cloud & DevOps
                                </option>
                                <option value="Dedicated Development Team">
                                  Dedicated Development Team
                                </option>
                                <option value="Technical Consulting">
                                  Technical Consulting
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="form-group">
                            <label className="form-label" htmlFor="message">
                              Message
                            </label>
                            <div className="form-control-wrap">
                              <textarea
                                id="message"
                                className="form-control form-control-xl"
                                rows={4}
                                placeholder="Tell us about your project"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="pt-2">
                            <button
                              type="submit"
                              className="btn btn-primary btn-lg"
                            >
                              Submit Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="section section-xl pt-1 pb-0 has-mask overflow-hidden">
        <div className="section-content">
          <div className="container">
            <div
              data-gsap-in='{"opacity": 0, "y": 50}'
              data-gsap-delay=".25"
              className="card card-border-glow card-border-glow-large card-blend card-blend-bottom has-mask"
            >
              <div className="row justify-content-center g-gs">
                <div className="col-lg-8 col-xl-7">
                  <div
                    data-gsap-in='{"opacity": 0, "y": 50}'
                    data-gsap-delay=".35"
                    className="text-center px-4 px-lg-0 py-10 py-md-18 pt-lg-27 pb-lg-38"
                  >
                    <h2 className="fs-1 fw-normal mb-6">
                      Ready to Build Scalable
                      <span className="no-split text-gradient-a">Software</span>
                      That Drives Growth?
                    </h2>
                    <p className="lead px-lg-14 mb-md-10 mb-6">
                      Partner with Stackwise Technologies Limited to design,
                      develop, and scale modern digital solutions tailored to
                      your business goals.
                    </p>
                    <ul className="nk-btn-list pt-3">
                      <li>
                        <a
                          href="https://calendly.com/stackwisetechnologies-info/30min"
                          className="btn btn-line-animated btn-lg"
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
                </div>
              </div>
              <div className="bg-mask nk-star-field" data-star-count="50"></div>
            </div>
          </div>
        </div>
        <div
          data-gsap-in='{"y": 200}'
          data-gsap-delay=".2"
          data-gsap-start="top 70%"
          className="bg-mask bg-glow-b opacity-50 z-1"
        ></div>
      </div>
      <div className="gradient-separator"></div>
    </main>
  );
}

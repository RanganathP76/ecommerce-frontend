import React from "react";
import "./PolicyPages.css";

const RefundPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Refund & Return Policy</h1>

      <p>
        At Cuztory, we ensure strict quality checks before dispatch. 
        Since most products are custom-made or order-specific, 
        <strong>we do not accept returns or provide refunds for reasons such as
        “change of mind”, “did not like the product”, or any non-valid reason.</strong>
      </p>

      <h2>Return / Replacement Eligibility</h2>
      <p>
        A return or replacement is only eligible under the following conditions:
      </p>
      <ul>
        <li>Wrong product delivered</li>
        <li>Damaged product received</li>
        <li>Missing items in the package</li>
      </ul>

      <h2>Mandatory Opening Video Requirement</h2>
      <p>
        To request a return or replacement, an <strong>unboxing/opening video is mandatory</strong>.
        The video must clearly show:
      </p>
      <ul>
        <li>The full package from all sides (before opening)</li>
        <li>The uncut/unedited opening of the package</li>
        <li>The damaged or incorrect product clearly visible</li>
      </ul>
      <p>
        <strong>Without a proper unboxing video, we cannot process any return or replacement.</strong>
      </p>

      <h2>Timeline to Report an Issue</h2>
      <p>
        You must report any issue within <strong>36 hours</strong> of delivery.
        Claims raised after 36 hours will not be eligible for return or replacement.
      </p>

      <h2>Review & Approval</h2>
      <p>
        Once your video and details are submitted, our Quality Team will review the claim.
        Based on the evidence, we will approve or reject the request.  
        If approved, we will arrange:
      </p>
      <ul>
        <li>A replacement shipment, or</li>
        <li>A return pickup (only if required)</li>
      </ul>

      <h2>No Direct Refunds</h2>
      <p>
        Refunds are provided <strong>only if replacement is not possible</strong> 
        due to stock unavailability. Refunds will be processed after confirmation 
        from our team.
      </p>

      <h2>Contact Us</h2>
      <p>
        For return or replacement requests, email us at:{" "}
        <a href="mailto:dignifydeals@gmail.com">support@yourstore.com</a>
      </p>
    </div>
  );
};

export default RefundPolicy;

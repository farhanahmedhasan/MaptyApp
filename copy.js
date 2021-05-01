`use strict`;
//Getting Value From Selected Field
let total = 4390;
let selectedIndexValue;

const form = document.querySelector(".form--delivary");
const btnCheckout = document.querySelector(".form__checkout");
const select = document.getElementById("selectDelivary");
document.querySelector(".total").textContent = total;

select.addEventListener("change", function () {
  selectedIndexValue = Number(form.selectDelivary.options[form.selectDelivary.selectedIndex].value);
  if (selectedIndexValue) {
    document.querySelector(".delivary--charge").textContent = selectedIndexValue;
    document.querySelector(".total").textContent = total + selectedIndexValue;
  } else {
    document.querySelector(".delivary--charge").textContent = "00";
    document.querySelector(".total").textContent = total;
  }
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (selectedIndexValue) alert(`You Have to pay ${total + selectedIndexValue} Tk`);
  else alert(`Select a value`);
});

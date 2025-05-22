from flask import Blueprint
from controllers import shipment_controller

shipment_bp = Blueprint('shipment_bp', __name__)

shipment_bp.route('/shipments/create', methods=['GET', 'POST'])(shipment_controller.create_shipment)
shipment_bp.route('/shipments/view')(shipment_controller.view_shipments)
shipment_bp.route('/shipments/update/<int:id>', methods=['GET', 'POST'])(shipment_controller.update_shipment)
shipment_bp.route('/shipments/delete/<int:id>')(shipment_controller.delete_shipment)
